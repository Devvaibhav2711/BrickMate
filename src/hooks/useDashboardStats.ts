import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalBricks: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  activeWorkers: number;
  monthlyProduction: number;
  monthlySales: number;
  monthlyExpenses: number;
}

export const useDashboardStats = (year: string, startMonth: string) => {
  return useQuery({
    queryKey: ['dashboard-stats', year, startMonth],
    queryFn: async (): Promise<DashboardStats> => {
      const isAll = year === 'all';
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (!isAll) {
        const y = parseInt(year);
        const m = parseInt(startMonth); // 0-11
        startDate = new Date(y, m, 1).toISOString().split('T')[0];
        endDate = new Date(y + 1, m, 1).toISOString().split('T')[0];
      }

      // Try to use the optimized RPC function (single database call)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_stats', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      // If RPC works, use it (much faster - single query)
      if (!rpcError && rpcData) {
        return {
          totalBricks: Number(rpcData.totalBricks) || 0,
          totalSales: Number(rpcData.totalSales) || 0,
          totalExpenses: Number(rpcData.totalExpenses) || 0,
          netProfit: Number(rpcData.netProfit) || 0,
          pendingPayments: Number(rpcData.pendingPayments) || 0,
          activeWorkers: Number(rpcData.activeWorkers) || 0,
          monthlyProduction: Number(rpcData.monthlyProduction) || 0,
          monthlySales: Number(rpcData.monthlySales) || 0,
          monthlyExpenses: Number(rpcData.monthlyExpenses) || 0,
        };
      }

      // Fallback to multiple queries if RPC not available
      let prodQuery = supabase.from('brick_production').select('quantity, date, labour_id');
      let salesQuery = supabase.from('sales').select('total_amount, amount_paid, payment_status, date');
      let expQuery = supabase.from('expenses').select('amount, date');
      let payQuery = supabase.from('customer_payments').select('amount, payment_date');
      let attQuery = supabase.from('attendance').select('labour_id, date');

      if (!isAll && startDate && endDate) {
        prodQuery = prodQuery.gte('date', startDate).lt('date', endDate);
        salesQuery = salesQuery.gte('date', startDate).lt('date', endDate);
        expQuery = expQuery.gte('date', startDate).lt('date', endDate);
        payQuery = payQuery.gte('payment_date', startDate).lt('payment_date', endDate);
        attQuery = attQuery.gte('date', startDate).lt('date', endDate);
      }

      const [productionRes, salesRes, expensesRes, labourRes, paymentsRes, attendanceRes] = await Promise.all([
        prodQuery,
        salesQuery,
        expQuery,
        supabase.from('labour').select('id'),
        payQuery,
        attQuery
      ]);

      if (productionRes.error) throw productionRes.error;
      if (salesRes.error) throw salesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (labourRes.error) throw labourRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const production = productionRes.data || [];
      const sales = salesRes.data || [];
      const expenses = expensesRes.data || [];
      const labour = labourRes.data || [];
      const payments = paymentsRes.data || [];
      const attendance = attendanceRes.data || [];

      const totalBricks = production.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const totalDirectPaid = sales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);
      const totalLedgerPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingPayments = totalSales - (totalDirectPaid + totalLedgerPaid);

      let activeWorkersCount = labour.length;
      if (!isAll) {
        const activeIds = new Set<string>();
        production.forEach(p => { if (p.labour_id) activeIds.add(p.labour_id); });
        attendance.forEach(a => { if (a.labour_id) activeIds.add(a.labour_id); });
        activeWorkersCount = activeIds.size;
      }

      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const monthlyProduction = production
        .filter(p => p.date >= startOfCurrentMonth && p.date <= endOfCurrentMonth)
        .reduce((sum, p) => sum + (p.quantity || 0), 0);

      const monthlySales = sales
        .filter(s => s.date >= startOfCurrentMonth && s.date <= endOfCurrentMonth)
        .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

      const monthlyExpenses = expenses
        .filter(e => e.date >= startOfCurrentMonth && e.date <= endOfCurrentMonth)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        totalBricks,
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        pendingPayments,
        activeWorkers: activeWorkersCount,
        monthlyProduction,
        monthlySales,
        monthlyExpenses,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
