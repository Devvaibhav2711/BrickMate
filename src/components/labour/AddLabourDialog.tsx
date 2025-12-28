import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAddLabour, useUpdateLabour, useLabour, LabourInsert, Labour } from '@/hooks/useLabour';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Save } from 'lucide-react';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

interface AddLabourDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    labourToEdit?: Labour | null;
}

export const AddLabourDialog = ({ open, onOpenChange, labourToEdit }: AddLabourDialogProps) => {
    const { t } = useLanguage();
    const addLabour = useAddLabour();
    const updateLabour = useUpdateLabour();

    const isEditMode = !!labourToEdit;

    const [formData, setFormData] = useState<LabourInsert>({
        name: '',
        mobile: '',
        work_type: 'aalekari',
        daily_wage: 0,
        adhar_no: '',
        family_members: '',
        address: '',
        email: ''
    });
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (labourToEdit) {
            setFormData({
                name: labourToEdit.name,
                mobile: labourToEdit.mobile || '',
                work_type: labourToEdit.work_type,
                daily_wage: labourToEdit.daily_wage,
                adhar_no: labourToEdit.adhar_no || '',
                family_members: labourToEdit.family_members || '',
                address: labourToEdit.address || '',
                email: labourToEdit.email || ''
            });
        } else {
            setFormData({
                name: '', mobile: '', work_type: 'general', daily_wage: 0,
                adhar_no: '', family_members: '', address: '', email: ''
            });
        }
    }, [labourToEdit, open]);

    const { data: labours } = useLabour();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, boolean> = {};
        if (!formData.name.trim()) newErrors.name = true;
        if (!formData.mobile) newErrors.mobile = true;
        if (!formData.address) newErrors.address = true;

        if (formData.mobile && labours?.some(l => l.mobile === formData.mobile && l.id !== labourToEdit?.id)) {
            toast.error(t('error') + ": Mobile number already exists");
            newErrors.mobile = true;
            setErrors(newErrors);
            return;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error(t('error') + ": " + t('fillRequiredFields'));
            return;
        }
        setErrors({});

        try {
            if (isEditMode && labourToEdit) {
                await updateLabour.mutateAsync({ id: labourToEdit.id, ...formData });
            } else {
                await addLabour.mutateAsync(formData);
            }

            // Note: Toast handled in hook, but we can verify
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] w-full max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-2xl font-bold">{isEditMode ? 'Edit Worker' : t('addLabour')}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form id="labour-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="name" className="text-sm font-medium">{t('labourName')} <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('enterWorkerName')}
                                    required
                                    className={`h-11 ${errors.name ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-sm font-medium">{t('mobileNumber')} <span className="text-destructive">*</span></Label>
                                <Input
                                    id="mobile"
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    placeholder="9876543210"
                                    className={`h-11 ${errors.mobile ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="wage" className="text-sm font-medium">{t('dailyWage')} (₹)</Label>
                                <FormattedNumberInput
                                    id="wage"
                                    value={formData.daily_wage}
                                    onChange={(val) => setFormData({ ...formData, daily_wage: val })}
                                    placeholder="500"
                                    className="h-11 font-semibold"
                                />
                            </div>

                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label className="text-sm font-medium">{t('workType')}</Label>
                                <Select
                                    value={formData.work_type}
                                    onValueChange={(value: any) => setFormData({ ...formData, work_type: value })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aalekari">{t('aalekari')}</SelectItem>
                                        <SelectItem value="varkam">{t('varkam')}</SelectItem>
                                        <SelectItem value="driver">{t('driver')}</SelectItem>
                                        <SelectItem value="bhatkar">{t('bhatkar')}</SelectItem>
                                        <SelectItem value="wageWork">{t('wageWork')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Professional Fields */}
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label htmlFor="address" className="text-sm font-medium">Address <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address"
                                    className={`min-h-[80px] resize-none ${errors.address ? "border-destructive" : ""}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adhar" className="text-sm font-medium">{t('adharNo')}</Label>
                                <Input
                                    id="adhar"
                                    value={formData.adhar_no || ''}
                                    onChange={(e) => setFormData({ ...formData, adhar_no: e.target.value })}
                                    placeholder="XXXX XXXX XXXX"
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="family" className="text-sm font-medium">Family Members</Label>
                                <Input
                                    id="family"
                                    value={formData.family_members || ''}
                                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                                    placeholder="Number/Names"
                                    className="h-11"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-background gap-2 sm:gap-0 sticky bottom-0 z-20">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 flex-1 sm:flex-none"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        form="labour-form"
                        className="h-11 flex-1 sm:flex-none min-w-[120px]"
                        disabled={addLabour.isPending || updateLabour.isPending}
                    >
                        {isEditMode ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isEditMode ? t('save') : t('save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
