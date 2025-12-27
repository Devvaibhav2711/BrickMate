
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

  return useMutation({
    mutationFn: async (production: ProductionInsert) => {
      const { data, error } = await supabase
        .from('brick_production')
        .insert([production])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      toast.success('Production record added successfully');
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
      toast.success('Record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });
};
