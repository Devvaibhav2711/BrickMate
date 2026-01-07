
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface Attendance {
    id: string;
    labour_id: string;
    date: string;
    is_present: boolean;
    description?: string | null;
    created_at: string;
}

export interface AttendanceInsert {
    labour_id: string;
    date: string;
    is_present: boolean;
    description?: string;
}

export const useAttendance = (startDate: Date | string, endDate: Date | string) => {
    const start = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
    const end = typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd');

    return useQuery({
        queryKey: ['attendance', start, end],
        queryFn: async () => {
            // For Week view that might span months, we just need to ensure the query covers the range.
            // gte/lte works perfectly for any range.
            const { data, error } = await supabase
                .from('attendance')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (error) throw error;
            return data as Attendance[];
        },
    });
};

export const useMarkAttendance = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ labour_id, date, is_present, description }: AttendanceInsert) => {
            // Upsert: If exists, update; else insert
            // Note: Supabase upsert requires a unique constraint conflict.
            // Schema has: constraint attendance_labour_date_key unique (labour_id, date)

            const { data, error } = await supabase
                .from('attendance')
                .upsert(
                    { labour_id, date, is_present, description },
                    { onConflict: 'labour_id,date' }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['labour'] }); // Update Labour Details (balance)
            // We don't toast on every checkbox click to avoid spam, maybe just silent success
        },
        onError: (error) => {
            toast.error('Failed to mark attendance: ' + error.message);
        },
    });
};
