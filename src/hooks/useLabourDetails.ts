import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Labour } from './useLabour';
import { Production } from './useProduction';

export type TransactionType = 'advance' | 'payment' | 'attendance' | 'production';

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    description: string;
    isDebit: boolean; // true if money given to labour (increases balance/debt), false if earned (decreases debt)
}
export const useLabourDetails = (labourId: string | undefined) => {
    return useQuery({
        queryKey: ['labour', labourId],
        enabled: !!labourId,
        queryFn: async () => {
            if (!labourId) throw new Error('Labour ID is required');
            const id = labourId; // Explicit const for TS narrowing

            // Fetch Labour Profile
            const { data: labour, error: labourError } = await supabase
                .from('labour')
                .select('*')
                .eq('id', id)
                .single();

            if (labourError) throw labourError;
            if (!labour) throw new Error('Labour not found');

            // Fetch Advances
            const { data: advances, error: advError } = await supabase
                .from('advance_payments')
                .select('*')
                .eq('labour_id', id)
                .order('date', { ascending: false });

            if (advError) throw advError;

            // Fetch Wage Payments (Cash given)
            const { data: payments, error: payError } = await supabase
                .from('wage_payments')
                .select('*')
                .eq('labour_id', id)
                .order('payment_date', { ascending: false });

            if (payError) throw payError;

            // Fetch Attendance (Earnings)
            const { data: attendance, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('labour_id', id)
                .eq('is_present', true)
                .order('date', { ascending: false });

            if (attError) throw attError;

            // Fetch Production (Earnings)
            const { data: production, error: prodError } = await supabase
                .from('brick_production')
                .select('*')
                .eq('labour_id', id)
                .order('date', { ascending: false });

            if (prodError) throw prodError;

            const productionData = production as unknown as Production[];

            // Calculate Transactions
            const transactions: Transaction[] = [];

            // Add Advances
            advances?.forEach(adv => {
                transactions.push({
                    id: adv.id,
                    date: adv.date,
                    type: 'advance',
                    amount: adv.amount,
                    description: adv.notes || 'Advance Payment',
                    isDebit: true
                });
            });

            // Add Payments
            payments?.forEach(pay => {
                transactions.push({
                    id: pay.id,
                    date: pay.payment_date,
                    type: 'payment',
                    amount: pay.amount,
                    description: pay.notes || 'Wage Payment',
                    isDebit: true
                });
            });

            // Add Attendance (Earnings)
            const dailyWage = labour.daily_wage || 0;
            attendance?.forEach(att => {
                transactions.push({
                    id: att.id,
                    date: att.date,
                    type: 'attendance',
                    amount: dailyWage,
                    description: 'Daily Wage (Present)',
                    isDebit: false
                });
            });

            // Add Production (Earnings)
            productionData?.forEach(prod => {
                const amount = (prod.quantity || 0) * (prod.rate_per_brick || 0);
                if (amount > 0) {
                    transactions.push({
                        id: prod.id,
                        date: prod.date,
                        type: 'production',
                        amount: amount,
                        description: `Production: ${prod.quantity} bricks @ ₹${prod.rate_per_brick} ${prod.notes ? `(${prod.notes})` : ''}`,
                        isDebit: false
                    });
                }
            });

            // Sort by Date
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Calculate Totals
            const totalGiven = transactions.filter(t => t.isDebit).reduce((sum, t) => sum + t.amount, 0);
            const totalEarned = transactions.filter(t => !t.isDebit).reduce((sum, t) => sum + t.amount, 0);
            const balance = totalGiven - totalEarned; // Positive = Labour owes Owner

            return {
                labour: labour as Labour,
                transactions,
                production: productionData, // Exposed raw production data
                stats: {
                    totalGiven,
                    totalEarned,
                    balance
                }
            };
        },
    });
};
