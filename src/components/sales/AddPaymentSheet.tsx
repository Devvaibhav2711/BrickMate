
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddCustomerPayment } from '@/hooks/useCustomerPayments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

    const [paymentMode, setPaymentMode] = useState<string>('प्राप्त झाले');
    const [paymentForm, setPaymentForm] = useState<{
        amount: string | number;
        date: string;
        notes: string;
    }>({
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: 'प्राप्त झाले'
    });

    // Reset form when opened for a new customer
    useEffect(() => {
        if (isOpen) {
            setPaymentForm({
                amount: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                notes: 'प्राप्त झाले' // Default note
            });
            setPaymentMode('प्राप्त झाले');
        }
    }, [isOpen, customerId]);

    // Update notes when mode changes
    useEffect(() => {
        if (isOpen) {
            if (paymentMode !== 'other') {
                setPaymentForm(prev => ({ ...prev, notes: paymentMode }));
            } else {
                // When switching to 'other', clear notes so user can type
                // But only if the notes were previously one of the presets to avoid clearing user text if they mis-click
                // For simplicity, let's just clear it if it equals one of the other options
                const presets = ['प्राप्त झाले', 'पैसे प्राप्त झाले', 'रोख रक्कम प्राप्त', 'फोन पे द्वारे प्राप्त', 'गुगल पे द्वारे प्राप्त'];
                if (presets.includes(paymentForm.notes)) {
                    setPaymentForm(prev => ({ ...prev, notes: '' }));
                }
            }
        }
    }, [paymentMode, isOpen]);


    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId || !paymentForm.amount || !paymentForm.date || !paymentForm.notes) {
            return;
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
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b">
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
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="payment-form" onSubmit={handleAddPayment} className="space-y-6">
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
                            <Label>{t('notes')}</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger className="bg-muted/30">
                                    <SelectValue placeholder="Select note type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="प्राप्त झाले">प्राप्त झाले (Received)</SelectItem>
                                    <SelectItem value="पैसे प्राप्त झाले">पैसे प्राप्त झाले (Money Received)</SelectItem>
                                    <SelectItem value="रोख रक्कम प्राप्त">रोख रक्कम प्राप्त (Cash)</SelectItem>
                                    <SelectItem value="फोन पे द्वारे प्राप्त">फोन पे (PhonePe)</SelectItem>
                                    <SelectItem value="गुगल पे द्वारे प्राप्त">गुगल पे (GooglePay)</SelectItem>
                                    <SelectItem value="other">इतर (Other)</SelectItem>
                                </SelectContent>
                            </Select>

                            {paymentMode === 'other' && (
                                <Textarea
                                    id="paymentNotes"
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    placeholder="इतर माहिती लिहा..."
                                    className="bg-muted/30 resize-none mt-2"
                                    rows={2}
                                />
                            )}
                        </div>
                    </form>
                </div>
                <div className="px-6 py-4 border-t bg-background sticky bottom-0 z-20 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-12" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" form="payment-form" className="flex-1 h-12 text-base shadow-lg shadow-primary/20" disabled={addPayment.isPending}>
                        {addPayment.isPending ? t('loadingText') : t('save')}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
