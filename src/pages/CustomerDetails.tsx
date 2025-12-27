import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, Phone, MapPin, Plus, Wallet, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerPayments, useAddCustomerPayment } from '@/hooks/useCustomerPayments';
import { Sale } from '@/hooks/useSales';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import { AddPaymentSheet } from '@/components/sales/AddPaymentSheet';
import { ReceiptModal } from '@/components/sales/ReceiptModal';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Transaction = {
    id: string;
    date: Date;
    type: 'sale' | 'payment';
    details: string;
    debit: number;  // Bill Amount
    credit: number; // Paid Amount
    balance: number; // Running Balance
};

export const CustomerDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [isStatementOpen, setIsStatementOpen] = useState(false);


    // Fetch Customer Profile
    const { data: customer, isLoading: loadingProfile } = useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    // Fetch Sales History
    const { data: sales, isLoading: loadingSales } = useQuery({
        queryKey: ['customer-sales', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sales')
                .select('*, customers(name, mobile)')
                .eq('customer_id', id)
                .order('date', { ascending: true }); // Oldest first for ledger calc
            if (error) throw error;
            return data as Sale[];
        },
        enabled: !!id,
    });

    // Fetch Payment History
    const { data: payments, isLoading: loadingPayments } = useCustomerPayments(id || '');

    const isLoading = loadingProfile || loadingSales || loadingPayments;

    // Calculate Ledger
    const transactions = useMemo(() => {
        if (!sales) return [];

        const txs: Transaction[] = [];
        let runningBalance = 0;

        // 1. Convert Sales to Transactions
        // Note: We intentionally process chronological order for running balance
        // We need to merge sales and payments and sort them by date.

        const rawSales = sales.map(sale => ({
            id: sale.id,
            date: new Date(sale.date),
            type: 'sale' as const,
            original: sale
        }));

        const rawPayments = (payments || []).map(payment => ({
            id: payment.id,
            date: new Date(payment.payment_date),
            type: 'payment' as const,
            original: payment
        }));

        const combined = [...rawSales, ...rawPayments].sort((a, b) => a.date.getTime() - b.date.getTime());

        combined.forEach(item => {
            if (item.type === 'sale') {
                const sale = item.original as Sale;

                // Debit: Total Bill
                runningBalance += sale.total_amount;
                txs.push({
                    id: sale.id,
                    date: item.date,
                    type: 'sale',
                    details: `${sale.quantity} ${t('bricks')} @ ${formatCurrency(sale.rate_per_brick)}`,
                    debit: sale.total_amount,
                    credit: 0,
                    balance: runningBalance
                });

                // Credit: Initial Payment (if any)
                if (sale.amount_paid > 0) {
                    runningBalance -= sale.amount_paid;
                    txs.push({
                        id: `${sale.id}_initial_payment`,
                        date: item.date,
                        type: 'payment',
                        details: t('amountPaid'), // 'Paid'
                        debit: 0,
                        credit: sale.amount_paid,
                        balance: runningBalance
                    });
                }
            } else {
                const payment = item.original as any;
                // Credit: Payment
                runningBalance -= payment.amount;
                txs.push({
                    id: payment.id,
                    date: item.date,
                    type: 'payment',
                    details: payment.notes || t('amountPaid'),
                    debit: 0,
                    credit: payment.amount,
                    balance: runningBalance
                });
            }
        });

        // We return reversed for display (Recent first) if preferred, BUT
        // for a Ledger, usually Date Ascending is clearer to trace the balance.
        // User asked for "Purchase History" style, which was descending.
        // However, with running balance, it's easier to read Top-Down (Oldest -> Newest).
        // Let's stick to Oldest -> Newest (Chronological) for logical flow.
        return txs;
    }, [sales, payments, t]);

    if (isLoading) return <PageLoader />;
    if (!customer) return <div>{t('customerNotFound')}</div>;

    // Derived Totals
    const totalSalesAmount = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
    const totalPaidAmount = (sales?.reduce((sum, s) => sum + s.amount_paid, 0) || 0) +
        (payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
    const finalBalance = totalSalesAmount - totalPaidAmount;

    const handlePrint = () => {
        window.print();
    };



    return (
        <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToAdmin')}
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => setIsPaymentSheetOpen(true)}>
                        <Wallet className="w-4 h-4 mr-2" />
                        {t('paid')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsStatementOpen(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {t('statement') || 'Statement'}
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="hidden md:flex">
                        <Printer className="w-4 h-4 mr-2" />
                        {t('printList') || 'Print List'}
                    </Button>
                </div>
            </div>

            {/* Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-2xl">{customer.name}</CardTitle>
                        <CardDescription>Customer ID: {customer.id.slice(0, 8)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{customer.mobile || t('noMobile')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{customer.address || t('noAddress')}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card className={finalBalance > 0 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"}>
                    <CardHeader>
                        <CardTitle>{t('currentBalance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold ${finalBalance > 0 ? "text-destructive" : "text-green-600"}`}>
                            {formatCurrency(finalBalance)}
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>{t('totalPurchased')}:</span>
                                <span>{formatCurrency(totalSalesAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('totalPaid')}:</span>
                                <span>{formatCurrency(totalPaidAmount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History (Ledger) */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('transactionHistory')}</CardTitle>
                    <CardDescription>{t('purchaseHistoryDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('date')}</TableHead>
                                <TableHead>{t('details')}</TableHead>
                                <TableHead className="text-right">{t('billAmount')}</TableHead>
                                <TableHead className="text-right">{t('paid')}</TableHead>
                                <TableHead className="text-right">{t('balance')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        {t('noData')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{format(tx.date, 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={tx.details}>
                                            {tx.details}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {tx.debit > 0 ? formatCurrency(tx.debit) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${tx.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                                            {formatCurrency(tx.balance)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Print Footer */}
            <div className="hidden print:block text-center mt-8 text-sm text-muted-foreground">
                <p>{t('generatedBy')} {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            </div>

            {/* Add Payment Sheet */}
            <AddPaymentSheet
                isOpen={isPaymentSheetOpen}
                onClose={() => setIsPaymentSheetOpen(false)}
                customerId={id || ''}
                customerName={customer.name}
            />
        </div>
    );
};
