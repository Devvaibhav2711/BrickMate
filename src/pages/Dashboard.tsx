import { motion } from 'framer-motion';
import {
  Factory,
  IndianRupee,
  Wallet,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/dashboard/StatCard';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useYearContext } from '@/contexts/YearContext';
import { CustomerSearch } from '@/components/dashboard/CustomerSearch';
import { PendingPaymentsDialog } from '@/components/dashboard/PendingPaymentsDialog';
import { ActiveWorkersDialog } from '@/components/dashboard/ActiveWorkersDialog';
import { useState } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const Dashboard = () => {
  const { t } = useLanguage();
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);
  const [isActiveWorkersDialogOpen, setIsActiveWorkersDialogOpen] = useState(false);
  const { selectedYear, startMonth, setYear, setStartMonth } = useYearContext();
  const currentYear = new Date().getFullYear();

  const { data: stats, isLoading } = useDashboardStats(selectedYear, startMonth);

  const years = Array.from({ length: 20 }, (_, i) => (currentYear + i).toString()); // 20 years window: Current + Future

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <CustomerSearch />

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex-1 min-w-[120px]">
            <Select value={selectedYear} onValueChange={setYear}>
              <SelectTrigger className="bg-background w-full">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y}>
                    {y}-{parseInt(y) + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <Select value={startMonth} onValueChange={setStartMonth}>
              <SelectTrigger className="bg-background w-full">
                <SelectValue placeholder="Start Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">January</SelectItem>
                <SelectItem value="3">April</SelectItem>
                <SelectItem value="9">October</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 text-white shadow-xl relative overflow-hidden custom-hero-card group"
        style={{
          backgroundImage: "url('/vithu_mauli.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20 z-0 transition-opacity group-hover:opacity-90" />
        <div className="relative z-10 flex flex-col justify-center h-full">
          <h2 className="text-sm font-medium opacity-90 text-white/90 uppercase tracking-wider">{t('thisMonth')}</h2>
          <div className="mt-2">
            <p className="text-4xl font-bold text-white tracking-tight">
              {formatNumber(stats?.monthlyProduction || 0)}
            </p>
            <p className="text-sm font-medium text-white/80 mt-1 flex items-center gap-2">
              <Factory className="w-4 h-4" />
              {t('bricksMade')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Factory className="w-5 h-5" />}
          label={t('totalBricks')}
          value={formatNumber(stats?.totalBricks || 0)}
          variant="primary"
          delay={0.1}
        />
        <StatCard
          icon={<IndianRupee className="w-5 h-5" />}
          label={t('totalSales')}
          value={formatCurrency(stats?.totalSales || 0)}
          variant="success"
          delay={0.15}
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label={t('totalExpenses')}
          value={formatCurrency(stats?.totalExpenses || 0)}
          variant="warning"
          delay={0.2}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label={t('netProfit')}
          value={formatCurrency(stats?.netProfit || 0)}
          variant={stats?.netProfit && stats.netProfit > 0 ? 'success' : 'default'}
          delay={0.25}
        />
      </div>

      {/* Additional Stats */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t('thisMonth')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label={t('activeWorkers')}
            value={stats?.activeWorkers || 0}
            delay={0.3}
            onClick={() => setIsActiveWorkersDialogOpen(true)}
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label={t('pendingPayments')}
            value={formatCurrency(stats?.pendingPayments || 0)}
            variant="warning"
            delay={0.35}
            onClick={() => setIsPendingDialogOpen(true)}
          />
        </div>
      </div>

      {/* Quick Actions - Visual placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-accent/50 rounded-xl p-4 border border-border"
      >
        <p className="text-sm text-muted-foreground text-center">
          {t('dashboard')} - {t('thisMonth')} {t('reports')}
        </p>
      </motion.div>

      <PendingPaymentsDialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen} />
      <ActiveWorkersDialog open={isActiveWorkersDialogOpen} onOpenChange={setIsActiveWorkersDialogOpen} />
    </div>
  );
};

export default Dashboard;
