
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Production {
  id: string;
  date: string;
  quantity: number;
  rate_per_brick: number;
  labour_id: string;
  team_name: string | null;
  notes: string | null;
  created_at: string;
  labour?: {
    id: string;
    name: string;
  }
}

export interface ProductionInsert {
  date: string;
  quantity: number;
  rate_per_brick: number;
  labour_id: string;
  team_name?: string;
  notes?: string;
}

import { useYearContext } from '@/contexts/YearContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const useProduction = () => {
  const { startDate, endDate, isAllTime } = useYearContext();

  return useQuery({
    queryKey: ['production', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('brick_production')
        .select(`
          *,
          labour (
            id,
            name
          )
        `)
        .order('date', { ascending: false });

      if (!isAllTime && startDate && endDate) {
        query = query.gte('date', startDate).lt('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Production[];
    },
  });
};

export const useAddProduction = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async (production: ProductionInsert & { worker_name?: string }) => {
      const { worker_name, ...productionData } = production;

      // 1. Add Production
      const { data, error } = await supabase
        .from('brick_production')
        .insert([productionData])
        .select()
        .single();

      if (error) throw error;

      // 2. Add as Expense (Auto-entry)
      try {
        const amount = production.quantity * production.rate_per_brick;
        const description = `${t('productionBy')} ${production.quantity} ${t('bricksBy')} ${worker_name || 'Worker'}. ${t('rateLabel')} ${production.rate_per_brick}`;

        const { error: expenseError } = await supabase
          .from('expenses')
          .insert([{
            category: 'labour',
            amount,
            date: production.date,
            description
          }]);

        if (expenseError) throw expenseError;
      } catch (err: any) {
        console.error("Failed to record expense:", err);
        toast.warning("Production saved, but failed to record as Expense.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['labour'] }); // Update Labour Details (balance)
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Production added and recorded as Expense');
    },
    onError: (error) => {
      toast.error('Failed to add production: ' + error.message);
    },
  });
};

export const useUpdateProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Production> & { id: string }) => {
      const { data, error } = await supabase
        .from('brick_production')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      toast.success('Production record updated');
    },
    onError: (error) => {
      toast.error('Failed to update production: ' + error.message);
    },
  });
};

export const useDeleteProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brick_production')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      toast.success('Record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
};
