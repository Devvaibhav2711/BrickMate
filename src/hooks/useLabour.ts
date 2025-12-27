import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Labour {
  id: string;
  name: string;
  mobile: string | null;
  work_type: 'moulding' | 'stacking' | 'loading' | 'general';
  daily_wage: number;
  created_at: string;
  updated_at: string;
  adhar_no?: string | null;
  family_members?: string | null;
  email?: string | null;
  address?: string | null;
  photo_url?: string | null;
  pin?: string | null;
  is_active?: boolean;
}

export interface LabourInsert {
  name: string;
  mobile?: string;
  work_type: 'moulding' | 'stacking' | 'loading' | 'general';
  daily_wage: number;
  adhar_no?: string;
  family_members?: string;
  email?: string;
  address?: string;
  photo_url?: string;
  pin?: string;
  is_active?: boolean;
}

import { useYearContext } from '@/contexts/YearContext';

export const useLabour = () => {
  const { startDate, endDate, isAllTime } = useYearContext();

  return useQuery({
    queryKey: ['labour', startDate, endDate],
    queryFn: async () => {
      // Optimize: Fetch count of attendance instead of all records
      // Note: PostgREST `count` usually requires a modifier or specific selection.
      // Using `attendance(count)` creates a lightweight response.
      const { data, error } = await supabase
        .from('labour')
        .select(`
          *,
          advance_payments(amount, created_at),
          wage_payments(amount, created_at, period_start, period_end),
          attendance(count)
        `)
        .order('name');

      if (error) throw error;

      return data.map((worker: any) => {
        const attendanceCount = worker.attendance?.[0]?.count || 0;

        return {
          ...worker,
          advance_payments: worker.advance_payments.filter((p: any) =>
            isAllTime || (startDate && endDate && p.created_at >= startDate && p.created_at < endDate)
          ).map((p: any) => ({ amount: p.amount, created_at: p.created_at })),
          wage_payments: worker.wage_payments.filter((p: any) =>
            isAllTime || (startDate && endDate && p.created_at >= startDate && p.created_at < endDate)
          ).map((p: any) => ({ amount: p.amount, period_start: p.period_start, period_end: p.period_end, created_at: p.created_at })),
          // Create dummy array to satisfy .length checks in UI without fetching full data
          attendance: Array(attendanceCount).fill({ id: 'dummy' })
        };
      }) as unknown as (Labour & {
        advance_payments: { amount: number, created_at: string }[],
        wage_payments: { amount: number, created_at: string, period_start?: string, period_end?: string }[],
        attendance: { date: string, is_present: boolean, description?: string | null }[]
      })[];
    },
  });
};

// Add types for better TS support (optional but good practice)
// wage_payments: { amount: number, period_start?: string, period_end?: string }[]

export const useAddLabour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (labour: LabourInsert) => {
      const { data, error } = await supabase
        .from('labour')
        .insert([labour])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      toast.success('Worker added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add worker: ' + error.message);
    },
  });
};

export const useUpdateLabour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Labour> & { id: string }) => {
      const { data, error } = await supabase
        .from('labour')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      toast.success('Worker updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update worker: ' + error.message);
    },
  });
};

export const useDeleteLabour = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('labour').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      toast.success('Worker deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete worker: ' + error.message);
    },
  });
};

export const useAddAdvance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ labour_id, amount, notes, date }: { labour_id: string; amount: number; notes: string; date: string }) => {
      const { data, error } = await supabase
        .from('advance_payments')
        .insert([{ labour_id, amount, notes, date }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      queryClient.invalidateQueries({ queryKey: ['labour', variables.labour_id] });
      toast.success('Advance added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add advance: ' + error.message);
    },
  });
};

export const useAddWagePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ labour_id, amount, notes, payment_date, period_start, period_end }: { labour_id: string; amount: number; notes: string; payment_date: string; period_start?: string; period_end?: string }) => {
      const { data, error } = await supabase
        .from('wage_payments')
        .insert([{
          labour_id,
          amount,
          notes,
          payment_date,
          period_start: period_start || payment_date, // Default to payment_date if not provided
          period_end: period_end || payment_date      // Default to payment_date if not provided
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labour'] });
      queryClient.invalidateQueries({ queryKey: ['labour', variables.labour_id] });
      toast.success('Payment added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add payment: ' + error.message);
    },
  });
};
