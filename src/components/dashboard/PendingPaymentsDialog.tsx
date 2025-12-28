import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from "lucide-react";

interface PendingPaymentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PendingPaymentsDialog({ open, onOpenChange }: PendingPaymentsDialogProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const { data: customersWithPending, isLoading } = useQuery({
        queryKey: ['pending-payments-list'],
        queryFn: async () => {
            // Fetch all required data
            const [salesRes, paymentsRes, customersRes] = await Promise.all([
                supabase.from('sales').select('customer_id, total_amount, amount_paid'),
                supabase.from('customer_payments').select('customer_id, amount'),
                supabase.from('customers').select('id, name, mobile')
            ]);

            if (salesRes.error) throw salesRes.error;
            if (paymentsRes.error) throw paymentsRes.error;
            if (customersRes.error) throw customersRes.error;

            // Group by Customer
            const customerMap = new Map<string, { id: string, name: string, mobile: string, pending: number }>();

            customersRes.data.forEach(c => {
                customerMap.set(c.id, { ...c, mobile: c.mobile || '', pending: 0 });
            });

            salesRes.data.forEach(s => {
                const c = customerMap.get(s.customer_id);
                if (c) {
                    c.pending += (s.total_amount - s.amount_paid);
                }
            });

            paymentsRes.data.forEach(p => {
                const c = customerMap.get(p.customer_id);
                if (c) {
                    c.pending -= p.amount;
                }
            });

            // Filter only those with pending > 0 and sort DESC
            return Array.from(customerMap.values())
                .filter(c => c.pending > 0)
                .sort((a, b) => b.pending - a.pending);
        },
        enabled: open // Only fetch when open
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('pendingPayments')}</DialogTitle>
                    <DialogDescription>
                        {t('pendingFromCustomers') || 'List of customers with outstanding balance.'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="h-[60vh] pr-4">
                        {customersWithPending?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('noData')}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('customerName')}</TableHead>
                                        <TableHead className="text-right">{t('amount')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customersWithPending?.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                navigate(`/customer/${customer.id}`);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <TableCell>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-xs text-muted-foreground">{customer.mobile}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-destructive">
                                                {formatCurrency(customer.pending)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
