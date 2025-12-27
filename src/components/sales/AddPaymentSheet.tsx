
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddCustomerPayment } from '@/hooks/useCustomerPayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Wallet } from 'lucide-react';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

interface AddPaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    customerName?: string;
}

export const AddPaymentSheet = ({ isOpen, onClose, customerId, customerName }: AddPaymentSheetProps) => {
    const { t } = useLanguage();
    const addPayment = useAddCustomerPayment();

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    // Reset form when opened for a new customer
    useEffect(() => {
        if (isOpen) {
            setPaymentForm({
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                notes: ''
            });
        }
    }, [isOpen, customerId]);

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId || !paymentForm.amount || !paymentForm.date || !paymentForm.notes) {
            // Assuming we want to show a toast if validation fails despite HTML5 checks
            return; // Or show toast
        }

        try {
            await addPayment.mutateAsync({
                customer_id: customerId,
                amount: Number(paymentForm.amount),
                payment_date: paymentForm.date,
                notes: paymentForm.notes
            });
            onClose();
        } catch (error) {
            console.error("Payment failed", error);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-left flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            {t('amountPaid')}
                            {customerName && <div className="text-sm font-normal text-muted-foreground">{customerName}</div>}
                        </div>
                    </SheetTitle>
                </SheetHeader>
                <form onSubmit={handleAddPayment} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="paymentDate">{t('date')}</Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            value={paymentForm.date}
                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                            required
                            className="bg-muted/30"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentAmount">{t('amount')} *</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-lg font-semibold text-muted-foreground z-10">₹</span>
                            <FormattedNumberInput
                                id="paymentAmount"
                                className="pl-8 text-lg font-semibold h-12 bg-muted/30"
                                value={paymentForm.amount}
                                onChange={(val) => setPaymentForm({ ...paymentForm, amount: val })}
                                placeholder="0"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentNotes">{t('notes')}</Label>
                        <Textarea
                            id="paymentNotes"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            placeholder={t('notes')}
                            className="bg-muted/30 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={onClose}>
                            {t('cancel')}
                        </Button>
                        <Button type="submit" className="flex-1 h-12 text-base shadow-lg shadow-primary/20" disabled={addPayment.isPending}>
                            {addPayment.isPending ? t('loadingText') : t('save')}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
};
