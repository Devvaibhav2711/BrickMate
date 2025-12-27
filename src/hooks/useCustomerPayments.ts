import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerPayment {
    id: string;
    customer_id: string;
    sale_id: string | null;
    amount: number;
    payment_date: string; // or date? types.ts says payment_date
    notes: string | null;
    created_at: string;
}

export interface CustomerPaymentInsert {
    customer_id: string;
    sale_id?: string | null;
    amount: number;
    payment_date: string;
    notes?: string | null;
}

export const useCustomerPayments = (customerId: string) => {
    return useQuery({
        queryKey: ['customer-payments', customerId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customer_payments')
                .select('*')
                .eq('customer_id', customerId)
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data as CustomerPayment[];
        },
        enabled: !!customerId,
    });
};



export const useAllCustomerPayments = () => {
    return useQuery({
        queryKey: ['all-customer-payments'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('customer_payments')
                .select('*')
                .order('payment_date', { ascending: false });

            if (error) throw error;
            return data as CustomerPayment[];
        },
    });
};

export const useAddCustomerPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: CustomerPaymentInsert) => {
            const { data, error } = await supabase
                .from('customer_payments')
                .insert([payment])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['customer-payments', variables.customer_id] });
            queryClient.invalidateQueries({ queryKey: ['customer', variables.customer_id] }); // Update balance if calculated on backend? (Not here, but good practice)
            // We might need to invalidate sales if we link them, but for now we are treating payments globally.
            toast.success('Payment recorded successfully');
        },
        onError: (error) => {
            toast.error('Failed to record payment: ' + error.message);
        },
    });
};
