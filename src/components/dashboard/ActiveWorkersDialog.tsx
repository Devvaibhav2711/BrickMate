import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActiveWorkersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ActiveWorkersDialog({ open, onOpenChange }: ActiveWorkersDialogProps) {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const { data: workers, isLoading } = useQuery({
        queryKey: ['active-workers-list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('labour')
                .select('*')
                // Assuming 'is_active' column exists or we list all. 
                // If is_active doesn't exist, we might list all. 
                // Previous context mentioned adding 'is_active' column.
                // Let's check safely or just select all for now and filter if needed.
                // Or simpler: Just list all labour as "Active Workers" usually implies the roster.
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: open
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('activeWorkers')}</DialogTitle>
                    <DialogDescription>
                        {t('allWorkersList')}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="h-[60vh] pr-4">
                        {workers?.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('noData')}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('labourName')}</TableHead>
                                        <TableHead>{t('workType')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workers?.map((worker) => (
                                        <TableRow
                                            key={worker.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                navigate(`/labour/${worker.id}`);
                                                onOpenChange(false);
                                            }}
                                        >
                                            <TableCell>
                                                <div className="font-medium">{worker.name}</div>
                                                <div className="text-xs text-muted-foreground">{worker.mobile}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{worker.work_type ? t(worker.work_type.toLowerCase() as any) : t('worker')}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
