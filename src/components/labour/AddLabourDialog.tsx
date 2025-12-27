import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddLabour, LabourInsert } from '@/hooks/useLabour';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

interface AddLabourDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AddLabourDialog = ({ open, onOpenChange }: AddLabourDialogProps) => {
    const { t } = useLanguage();
    const addLabour = useAddLabour();

    const [formData, setFormData] = useState<LabourInsert>({
        name: '',
        mobile: '',
        work_type: 'general',
        daily_wage: 0,
        adhar_no: '',
        family_members: '',
        address: '',
        email: ''
    });
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};
        if (!formData.name.trim()) newErrors.name = true;
        if (!formData.mobile) newErrors.mobile = true;
        // Address is strictly required in original file? Let's keep it consistent but maybe lenient if user wants speed.
        if (!formData.address) newErrors.address = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(t('error') + ": " + t('fillRequiredFields'));
            return;
        }
        setErrors({});

        try {
            await addLabour.mutateAsync(formData);
            setFormData({
                name: '', mobile: '', work_type: 'general', daily_wage: 0,
                adhar_no: '', family_members: '', address: '', email: ''
            });
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-[32px] p-0 h-[90vh] flex flex-col">
                <div className="p-6 pb-2 border-b bg-background rounded-t-[32px] sticky top-0 z-10">
                    <SheetTitle className="text-left text-2xl font-bold">{t('addLabour')}</SheetTitle>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-2 pb-safe-offset-20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="name" className="text-muted-foreground">{t('labourName')} *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('enterWorkerName')}
                                    required
                                    className={`h-12 bg-card text-lg ${errors.name ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-muted-foreground">{t('mobileNumber')}</Label>
                                <Input
                                    id="mobile"
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="9876543210"
                                    className={`h-11 bg-card ${errors.mobile ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wage" className="text-muted-foreground">{t('dailyWage')} (₹)</Label>
                                <FormattedNumberInput
                                    id="wage"
                                    value={formData.daily_wage}
                                    onChange={(val) => setFormData({ ...formData, daily_wage: val })}
                                    placeholder="500"
                                    className="h-11 bg-card font-semibold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">{t('workType')}</Label>
                            <Select
                                value={formData.work_type}
                                onValueChange={(value: any) => setFormData({ ...formData, work_type: value })}
                            >
                                <SelectTrigger className="h-12 bg-card">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="moulding">{t('moulding')}</SelectItem>
                                    <SelectItem value="stacking">{t('stacking')}</SelectItem>
                                    <SelectItem value="loading">{t('loading')}</SelectItem>
                                    <SelectItem value="general">{t('general')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Professional Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="address" className="text-muted-foreground">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
                                    className={`min-h-[80px] bg-card resize-none ${errors.address ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adhar" className="text-muted-foreground">{t('adharNo')}</Label>
                                <Input
                                    id="adhar"
                                    value={formData.adhar_no || ''}
                                    onChange={(e) => setFormData({ ...formData, adhar_no: e.target.value })}
                                    placeholder="XXXX XXXX"
                                    className="h-11 bg-card"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="family" className="text-muted-foreground">Family M.</Label>
                                <Input
                                    id="family"
                                    value={formData.family_members || ''}
                                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                                    placeholder="Count/Names"
                                    className="h-11 bg-card"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 pb-8 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent z-10">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 text-base rounded-xl"
                                onClick={() => onOpenChange(false)}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                disabled={addLabour.isPending}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {t('save')}
                            </Button>
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};
