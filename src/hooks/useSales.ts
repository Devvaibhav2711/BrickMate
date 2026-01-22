import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sale {
  id: string;
  customer_id: string;
  date: string;
  quantity: number;
  rate_per_brick: number;
  total_amount: number;
  amount_paid: number;
  payment_status: 'paid' | 'pending' | 'partial';
  notes: string | null;
  created_at: string;
  customers?: {
    name: string;
    mobile: string | null;
  } | null;
}

export interface SaleInsert {
  customer_id: string;
  date: string;
  quantity: number;
  rate_per_brick: number;
  total_amount: number;
  amount_paid: number;
  payment_status: 'paid' | 'pending' | 'partial';
  notes?: string;
}

export const useSales = () => {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, customers(name, mobile)')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};

export const useAddSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: SaleInsert) => {
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customer-sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Sale recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record sale: ' + error.message);
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SaleInsert> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customer-sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Sale - Updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update sale: ' + error.message);
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['customer-sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Sale deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete sale: ' + error.message);
    },
  });
};
