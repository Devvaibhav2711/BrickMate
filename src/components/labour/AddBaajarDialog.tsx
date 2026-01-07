import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddWagePayment, useLabour } from '@/hooks/useLabour';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, ShoppingBag } from 'lucide-react';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

interface AddBaajarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AddBaajarDialog = ({ open, onOpenChange }: AddBaajarDialogProps) => {
    const { t } = useLanguage();
    const { data: labours } = useLabour();
    const addPayment = useAddWagePayment();

    const [selectedLabourId, setSelectedLabourId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLabourId) {
            toast.error(t('error') + ": " + t('selectLabour'));
            return;
        }
        if (!amount) {
            toast.error(t('error') + ": " + t('amount') + " is required");
            return;
        }

        const selectedLabour = labours?.find(l => l.id === selectedLabourId);

        try {
            await addPayment.mutateAsync({
                labour_id: selectedLabourId,
                amount: Number(amount),
                notes: notes || 'Baajar', // Default note
                payment_date: paymentDate,
                worker_name: selectedLabour?.name
            });

            // Reset form
            setSelectedLabourId('');
            setAmount('');
            setNotes('');
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        {t('baajar')}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="baajar-global-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('selectLabour')}</Label>
                            <Select value={selectedLabourId} onValueChange={setSelectedLabourId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectLabour')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {labours?.map((labour) => (
                                        <SelectItem key={labour.id} value={labour.id}>
                                            {labour.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('date')}</Label>
                            <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('amount')} (₹)</Label>
                            <FormattedNumberInput required value={amount} onChange={(val) => setAmount(val.toString())} />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('notes')}</Label>
                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Weekly Market" />
                        </div>
                    </form>
                </div>
                <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                    <Button type="submit" form="baajar-global-form" className="w-full" disabled={addPayment.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
