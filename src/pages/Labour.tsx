import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Phone, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLabour } from '@/hooks/useLabour';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { cn, formatCurrency } from '@/lib/utils';
import { AddLabourDialog } from '@/components/labour/AddLabourDialog';
import { AddBaajarDialog } from '@/components/labour/AddBaajarDialog';
import { ShoppingBag } from 'lucide-react';

const workTypeColors = {
  moulding: 'bg-primary/10 text-primary',
  stacking: 'bg-success/10 text-success',
  loading: 'bg-warning/10 text-warning',
  general: 'bg-muted text-muted-foreground',
};

export const Labour = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: labourList, isLoading } = useLabour();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBaajarOpen, setIsBaajarOpen] = useState(false);





  if (isLoading) {
    return <PageLoader />;
  }

  // Calculate Total Outstanding Balance
  let totalOutstanding = 0;

  const enrichedList = labourList?.map(worker => {
    // Basic calculation: (Advances + Payments) - (Attendance Days * Current Daily Wage)
    // Note: This is an estimation. Precise accounting should be transaction based.
    const totalGiven = (worker.advance_payments?.reduce((s, i) => s + i.amount, 0) || 0) +
      (worker.wage_payments?.reduce((s, i) => s + i.amount, 0) || 0);

    // Assuming simple daily wage model for main view estimate
    const daysWorked = worker.attendance?.length || 0;
    const totalEarned = daysWorked * (worker.daily_wage || 0);

    const balance = totalGiven - totalEarned; // Positive = They Owe Used
    totalOutstanding += balance;

    return { ...worker, balance };
  }) || [];

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">{t('labour')}</h2>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {labourList?.length || 0} {t('activeWorkers').toLowerCase()}
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsBaajarOpen(true)}>
          <ShoppingBag className="w-4 h-4 mr-2" />
          {t('baajar')}
        </Button>
      </div>

      {/* Total Outstanding Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t('totalOutstanding')}</p>
            <h3 className="text-2xl font-bold text-primary">{formatCurrency(totalOutstanding)}</h3>
            <p className="text-xs text-muted-foreground">{t('netReceivables')}</p>
          </div>
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      {!enrichedList.length ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-muted-foreground" />}
          title={t('noData')}
          description={t('addFirstWorker')}
          actionLabel={t('addLabour')}
          onAction={() => setIsSheetOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {enrichedList.map((worker, index) => (
              <motion.div
                key={worker.id}
                onClick={() => navigate(`/labour/${worker.id}`)}
                className="bg-card rounded-xl p-4 border border-border shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg truncate">
                      {worker.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      {worker.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {worker.mobile}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          workTypeColors[worker.work_type]
                        )}
                      >
                        {t(worker.work_type)}
                      </span>
                      <span className={`text-sm font-bold ${worker.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {worker.balance > 0 ? t('toRecover') : t('payableToWorker')} : {formatCurrency(Math.abs(worker.balance))}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FloatingActionButton
        onClick={() => setIsSheetOpen(true)}
        label={t('addLabour')}
      />

      <AddLabourDialog open={isSheetOpen} onOpenChange={setIsSheetOpen} />
      <AddBaajarDialog open={isBaajarOpen} onOpenChange={setIsBaajarOpen} />
    </div >
  );
};

export default Labour;
