import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Calendar, Plus, Truck, Wrench, Package, MoreHorizontal, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses, useAddExpense, ExpenseInsert } from '@/hooks/useExpenses';
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
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { cn, formatCurrency } from '@/lib/utils';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

const categoryIcons = {
  raw_material: Package,
  transport: Truck,
  labour: IndianRupee,
  maintenance: Wrench,
  other: MoreHorizontal,
};

const categoryColors = {
  raw_material: 'bg-primary/10 text-primary',
  transport: 'bg-warning/10 text-warning',
  labour: 'bg-success/10 text-success',
  maintenance: 'bg-accent text-accent-foreground',
  other: 'bg-muted text-muted-foreground',
};

import { DateRangeFilter, DateRange } from '@/components/shared/DateRangeFilter';

export const Expenses = () => {
  const { t } = useLanguage();
  const { data: expenses, isLoading } = useExpenses();
  const addExpense = useAddExpense();
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [formData, setFormData] = useState<ExpenseInsert>({
    category: 'raw_material',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Strict validation
    const newErrors: Record<string, boolean> = {};
    if (formData.amount <= 0) newErrors.amount = true;
    if (!formData.category) newErrors.category = true;
    if (!formData.date) newErrors.date = true;
    if (!formData.description) newErrors.description = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('error') + ": " + "All fields are required");
      return;
    }
    setErrors({});

    await addExpense.mutateAsync(formData);
    setFormData({
      category: 'raw_material',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
    setIsSheetOpen(false);
  };

  const filteredExpenses = expenses?.filter(expense => {
    if (!dateRange.from) return true;
    const expenseDate = new Date(expense.date);
    if (dateRange.to) {
      return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
    }
    // If only from date is set (e.g. single day selection logic if we add that later), 
    // or typically ranged filters set both. 
    // For our preset 'today'/'yesterday', both from and to are set.
    // If we only have 'from', we can treat it as 'from this date onwards' or 'exact date'.
    // Given the component logic, presets set both.
    return expenseDate >= dateRange.from;
  }) || [];

  const totalExpenses = filteredExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-4">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-warning/10 border border-warning/20 rounded-2xl p-5 mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-warning/20 rounded-lg">
            <Wallet className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('totalExpenses')}</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-foreground">{t('expenses')}</h2>
        <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      {!filteredExpenses?.length ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-muted-foreground" />}
          title={t('noData')}
          description={t('trackFirstExpense')}
          actionLabel={t('addExpense')}
          onAction={() => setIsSheetOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredExpenses.map((expense, index) => {
              const Icon = categoryIcons[expense.category];
              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-4 border border-border shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg', categoryColors[expense.category])}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground capitalize">
                          {t(expense.category === 'raw_material' ? 'rawMaterial' : expense.category)}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(expense.date), 'dd MMM yyyy')}
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {expense.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(Number(expense.amount))}
                      </p>
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
        label={t('addExpense')}
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-0 overflow-hidden max-h-[90dvh] flex flex-col gap-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left text-2xl font-bold">{t('addExpense')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-background to-muted/20">
            <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <Label htmlFor="expenseAmount" className="text-muted-foreground">{t('amount')} (₹) *</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₹</span>
                  <FormattedNumberInput
                    id="expenseAmount"
                    value={formData.amount || ''}
                    onChange={(val) => setFormData({ ...formData, amount: val })}
                    placeholder="0"
                    required
                    className={`h-16 text-3xl font-bold pl-10 bg-card border-2 transition-all ${errors.amount ? "border-destructive focus-visible:ring-destructive" : "border-muted focus-visible:border-primary focus-visible:ring-0"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('category')} *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-12 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">{t('rawMaterial')}</SelectItem>
                      <SelectItem value="transport">{t('transport')}</SelectItem>
                      <SelectItem value="labour">{t('labour')}</SelectItem>
                      <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                      <SelectItem value="other">{t('other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseDate">{t('date')} *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className={`h-12 bg-card ${errors.date ? "border-destructive" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenseDesc">{t('description')}</Label>
                <Textarea
                  id="expenseDesc"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('soilPurchase')}
                  rows={3}
                  className={`bg-card resize-none ${errors.description ? "border-destructive" : ""}`}
                />
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t bg-background sticky bottom-0 z-20 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 h-12 text-base rounded-xl" onClick={() => setIsSheetOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" form="expense-form" className="flex-1 h-12 text-base rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={addExpense.isPending}>
              <Plus className="w-5 h-5 mr-2" />
              {t('save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div >
  );
};

export default Expenses;
