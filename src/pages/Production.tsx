import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Calendar, Plus, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProduction, useAddProduction, ProductionInsert } from '@/hooks/useProduction';
import { useLabour } from '@/hooks/useLabour';
import { formatCurrency } from '@/lib/utils';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { WorkerHistorySheet } from '@/components/admin/WorkerHistorySheet';
import { Labour } from '@/hooks/useLabour';

export const Production = () => {
  const { t } = useLanguage();
  const { data: productionList, isLoading } = useProduction();
  const { data: labourList } = useLabour();
  const addProduction = useAddProduction();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedWorkerHistory, setSelectedWorkerHistory] = useState<Labour | null>(null);
  const [formData, setFormData] = useState<ProductionInsert>({
    date: format(new Date(), 'yyyy-MM-dd'),
    quantity: 0,
    rate_per_brick: 0,
    labour_id: undefined,
    team_name: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strict validation: Date, Labour, Bhatti No (team_name), Quantity, Rate are ALL required now.
    if (!formData.date || !formData.labour_id || !formData.team_name || !formData.quantity || !formData.rate_per_brick) {
      toast.error(t('error') + ": All fields are required");
      return;
    }
    if (formData.quantity <= 0) return;

    const selectedWorker = labourList?.find(l => l.id === formData.labour_id);

    await addProduction.mutateAsync({
      ...formData,
      quantity: Number(formData.quantity),
      rate_per_brick: Number(formData.rate_per_brick),
      worker_name: selectedWorker?.name
    } as any);

    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 0,
      rate_per_brick: 0,
      labour_id: undefined,
      team_name: '',
      notes: '',
    });
    setIsSheetOpen(false);
  };



  const totalBricks = productionList?.reduce((sum, p) => sum + p.quantity, 0) || 0;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-4">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-brick rounded-2xl p-5 text-primary-foreground shadow-brick mb-4"
      >
        <div className="flex items-center gap-3">
          <Factory className="w-8 h-8" />
          <div>
            <p className="text-sm opacity-90">{t('totalBricks')}</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('en-IN').format(totalBricks)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{t('production')}</h2>
      </div>

      {!productionList?.length ? (
        <EmptyState
          icon={<Factory className="w-8 h-8 text-muted-foreground" />}
          title={t('noData')}
          description="Record your first brick production"
          actionLabel={t('addProduction')}
          onAction={() => setIsSheetOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {labourList?.map((worker, index) => {
              const workerProduction = productionList.filter(p => p.labour_id === worker.id);
              if (workerProduction.length === 0) return null;

              const workerTotal = workerProduction.reduce((sum, p) => sum + p.quantity, 0);
              const workerEarnings = workerProduction.reduce((sum, p) => sum + (p.quantity * (p.rate_per_brick || 0)), 0);

              return (
                <motion.div
                  key={worker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-4 border border-border shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedWorkerHistory(worker)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{worker.name}</h3>
                      <p className="text-sm text-muted-foreground">{t('totalBricks')}: {workerTotal.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(workerEarnings)}</p>
                      <button className="text-xs text-primary underline mt-1">{t('viewHistory')}</button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <FloatingActionButton
        onClick={() => setIsSheetOpen(true)}
        label={t('addProduction')}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">{t('addProduction')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="production-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('date')} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('selectLabour')} *</Label>
                  <Select
                    value={formData.labour_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, labour_id: value || undefined })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectLabour')} />
                    </SelectTrigger>
                    <SelectContent>
                      {labourList?.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productionQuantity">{t('quantity')} *</Label>
                  <FormattedNumberInput
                    id="productionQuantity"
                    value={formData.quantity || ''}
                    onChange={(val) => setFormData({ ...formData, quantity: val })}
                    placeholder="1000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productionRate">{t('ratePer1000')} *</Label>
                  <FormattedNumberInput
                    id="productionRate"
                    value={formData.rate_per_brick || ''}
                    onChange={(val) => setFormData({ ...formData, rate_per_brick: val })}
                    placeholder="Rate"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team">{t('bhattiNo')} *</Label>
                  <Select
                    value={formData.team_name || ''}
                    onValueChange={(value) => setFormData({ ...formData, team_name: value })}
                    required
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder={t('bhattiNo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('notes')}</Label>
                  <Input
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional details"
                  />
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg flex justify-between items-center font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(Number(formData.quantity || 0) * Number(formData.rate_per_brick || 0))}
                </span>
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t bg-background sticky bottom-0 z-20 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsSheetOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="production-form"
              className="flex-1"
              disabled={addProduction.isPending}
            >
              <Plus className="w-4 h-4" />
              {t('save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <WorkerHistorySheet
        isOpen={!!selectedWorkerHistory}
        onClose={() => setSelectedWorkerHistory(null)}
        worker={selectedWorkerHistory}
        production={productionList}
      />
    </div >
  );
};

export default Production;
