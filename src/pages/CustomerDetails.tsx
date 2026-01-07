import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, Phone, MapPin, Plus, Wallet, Share2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomerPayments, useAddCustomerPayment } from '@/hooks/useCustomerPayments';
import { useCustomers } from '@/hooks/useCustomers';
import { Sale } from '@/hooks/useSales';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/utils';
import { AddPaymentSheet } from '@/components/sales/AddPaymentSheet';
import { StatementTemplate } from '@/components/sales/StatementTemplate';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Transaction = {
    id: string;
    date: Date;
    type: 'sale' | 'payment';
    details: string;
    debit: number;  // Bill Amount
    credit: number; // Paid Amount
    balance: number; // Running Balance
    quantity?: number;
    rate?: number;
};

export const CustomerDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const isMarathi = language === 'mr';

    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [isProStatementOpen, setIsProStatementOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const statementRef = useState<HTMLDivElement | null>(null);

    const handleShare = async (templateRef: HTMLDivElement | null, shareMode: 'native' | 'whatsapp') => {
        if (!templateRef) return;
        setIsConverting(true);
        const toastId = toast.loading("Processing Invoice...");

        try {
            // 1. Clone element (Standard A4 Logic)
            const clone = templateRef.cloneNode(true) as HTMLElement;
            clone.style.position = 'fixed';
            clone.style.top = '-10000px';
            clone.style.left = '-10000px';
            clone.style.width = '210mm';
            clone.style.height = 'auto';
            clone.style.minHeight = '297mm';
            clone.style.zIndex = '-9999';
            clone.style.background = 'white';
            clone.style.transform = 'none';
            document.body.appendChild(clone);

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                windowWidth: 1000,
            });

            document.body.removeChild(clone);

            // 2. Convert to Blob (JPEG)
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error("Failed to generate file", { id: toastId });
                    setIsConverting(false);
                    return;
                }

                const safeName = (customer?.name || 'Customer').replace(/[^a-z0-9]/gi, '_');
                const fileName = `Invoice_${safeName}.png`;

                const file = new File([blob], fileName, { type: 'image/png' });

                // Construct WhatsApp Link (for Fallback)
                let phone = customer?.mobile || '';
                phone = phone.replace(/\D/g, '');
                if (phone.length === 10) phone = '91' + phone;

                const msg = encodeURIComponent(`Invoice for ${customer?.name || 'Customer'}.`);
                const waUrl = phone
                    ? `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`
                    : `https://web.whatsapp.com/send?text=${msg}`;

                if (shareMode === 'native') {
                    // Option A: Mobile Native Share
                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'Invoice',
                                text: msg
                            });
                            toast.success("Shared!", { id: toastId });
                        } catch (err) {
                            if ((err as Error).name !== 'AbortError') {
                                console.warn("Native share error:", err);
                                toast.error("Share failed", { id: toastId });
                            }
                        }
                    } else {
                        toast.error("Native sharing not supported capabilities on this device.", { id: toastId });
                    }
                } else {
                    // Option B: WhatsApp specific (Copy + Link)
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ [blob.type]: blob })
                        ]);
                        window.open(waUrl, '_blank');
                        toast.success("Image Copied! Paste (Ctrl+V) in WhatsApp", { id: toastId, duration: 6000 });
                    } catch (clipErr) {
                        console.error("Clipboard failed", clipErr);
                        window.open(waUrl, '_blank');
                        toast.error("Could not share automatically. Please use Download button.", { id: toastId });
                    }
                }

                setIsConverting(false);

            }, 'image/png');

        } catch (e) {
            console.error(e);
            toast.error("Process failed", { id: toastId });
            setIsConverting(false);
        }
    };

    const handleDownloadImage = async (templateRef: HTMLDivElement | null) => {
        if (!templateRef) return;
        setIsConverting(true);
        const toastId = toast.loading("Preparing download...");

        try {
            // 1. Clone element for A4 capture
            const clone = templateRef.cloneNode(true) as HTMLElement;
            clone.style.position = 'fixed';
            clone.style.top = '-10000px';
            clone.style.left = '-10000px';
            clone.style.width = '210mm';
            clone.style.height = 'auto'; // Let content flow
            clone.style.minHeight = '297mm';
            clone.style.zIndex = '-9999';
            clone.style.background = 'white';
            clone.style.transform = 'none';
            document.body.appendChild(clone);

            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                windowWidth: 1000,
            });

            document.body.removeChild(clone);

            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error("Failed to generate file", { id: toastId });
                    setIsConverting(false);
                    return;
                }
                const fileName = `Invoice_${customer?.name || 'Customer'}.png`;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                toast.success("Invoice Downloaded", { id: toastId });
                setIsConverting(false);
            }, 'image/png');

        } catch (e) {
            console.error(e);
            toast.error("Download failed", { id: toastId });
            setIsConverting(false);
        }
    };


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
    const { data: allCustomers, isLoading: loadingAllCustomers } = useCustomers();

    const isLoading = loadingProfile || loadingSales || loadingPayments || loadingAllCustomers;

    // Calculate Receipt No (Customer Serial No)
    // "invoice no shoul be start from 0001 when new user added then hi will get 0002"
    // useCustomers returns DESC order (Newest first).
    const receiptNo = useMemo(() => {
        if (!allCustomers || !id) return '0001';
        // useCustomers sorts by created_at DESC (Newest first).
        // So:
        // Index 0: Newest (Total Count)
        // Index N: Oldest (0001)

        // Serial = Total - Index of current
        const index = allCustomers.findIndex(c => c.id === id);
        if (index === -1) return '0001';

        const serial = allCustomers.length - index;
        return serial.toString().padStart(4, '0');
    }, [allCustomers, id]);

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
                    details: t('bricks'), // or 'Veet'
                    quantity: sale.quantity,
                    rate: sale.rate_per_brick,
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





    return (
        <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToAdmin')}
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => setIsPaymentSheetOpen(true)}>
                        <Wallet className="w-4 h-4 mr-2" />
                        {t('paid')}
                    </Button>


                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setIsProStatementOpen(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        {isMarathi ? 'PDF / पावती' : 'PDF / Invoice'}
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



            {/* Professional Statement Dialog */}
            <Dialog open={isProStatementOpen} onOpenChange={setIsProStatementOpen}>
                <DialogContent className="max-w-[95vw] md:max-w-[220mm] w-full bg-gray-100 p-0 overflow-auto max-h-[90vh]">
                    <div className="sticky top-0 z-10 bg-white border-b p-4 flex justify-end gap-2 shadow-sm print:hidden">
                        <Button variant="outline" onClick={() => setIsProStatementOpen(false)}>Close</Button>
                        <Button variant="outline" disabled={isConverting} onClick={() => {
                            const el = document.getElementById('pro-statement-template');
                            if (el) handleDownloadImage(el as HTMLDivElement);
                        }}>
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white" disabled={isConverting}>
                                    <Share2 className="w-4 h-4 mr-2" /> Share Options
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => {
                                    const el = document.getElementById('pro-statement-template');
                                    if (el) handleShare(el as HTMLDivElement, 'native');
                                }}>
                                    Share via App...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const el = document.getElementById('pro-statement-template');
                                    if (el) handleShare(el as HTMLDivElement, 'whatsapp');
                                }}>
                                    Share WhatsApp
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Hidden Print Button to trigger specific print */}
                        <button id="pro-statement-print-btn" className="hidden" onClick={() => {
                            // Print logic: we can use window.print() but we need to ensure styles target this modal content
                            // Or simpler: Open a new window? No, CSS @media print is best.
                            // We already have print styles. We need to hide everything else and show THIS.
                            // The StatementTemplate is inside this dialog.
                            // We might need to add a class to body to toggle print mode vs normal 'Print List' mode.
                            // For now, let's just window.print() and reliance on print.css
                            // BUT print.css currently hides everything except #receipt-container.
                            // We need to update print.css to also support printing .pro-statement
                            window.print();
                        }}></button>
                    </div>
                    <div className="p-4 print:p-0 flex justify-center">
                        <div id="pro-statement-template" className="print:w-full">
                            <StatementTemplate
                                customerName={customer.name}
                                customerMobile={customer.mobile}
                                customerAddress={customer.address}
                                transactions={transactions}
                                totalAmount={totalSalesAmount}
                                paidAmount={totalPaidAmount}
                                balanceDue={finalBalance}
                                receiptNo={receiptNo}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
