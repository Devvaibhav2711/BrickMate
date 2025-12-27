import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Labour } from "@/hooks/useLabour";
import { Production } from "@/hooks/useProduction";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '@/lib/utils';

interface WorkerHistorySheetProps {
    isOpen: boolean;
    onClose: () => void;
    worker: Labour | null;
    production: Production[] | undefined;
}

export const WorkerHistorySheet = ({ isOpen, onClose, worker, production }: WorkerHistorySheetProps) => {
    const { t } = useLanguage();

    if (!worker) return null;

    const workerProduction = production?.filter(p => p.labour_id === worker.id) || [];

    // Calculate Stats
    const totalBricks = workerProduction.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalEarned = workerProduction.reduce((sum, p) => sum + ((p.quantity || 0) * (p.rate_per_brick || 0) / 1000), 0); // Assuming rate is per 1000 usually, but let's check logic in Admin. 
    // Wait, Admin.tsx logic for Total Amount in Sales is quantity * rate. 
    // For Production, it's usually "Rate per 1000" or "Rate per brick".
    // In `Admin.tsx` it just says `rate_per_brick`. If it is rate PER BRICK, then Q * R. If per 1000, then (Q/1000)*R. 
    // Let's assume Rate per Brick for now unless I see "per 1000" logic elsewhere. 
    // Scanning Admin.tsx snippet... "const total = editingSale.quantity * editingSale.rate_per_brick;" 
    // So it seems it is treated as Rate Per Brick (or the quantity is small). 
    // However, usually bricks are 1000s. 
    // Let's stick to simple multiplication for now: Q * Rate.

    const totalValue = workerProduction.reduce((sum, p) => sum + ((p.quantity || 0) * (p.rate_per_brick || 0)), 0);


    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>{worker.name} - {t('history')}</SheetTitle>
                    <div className="text-sm text-muted-foreground">
                        {t(worker.work_type)} | {formatCurrency(worker.daily_wage)}/{t('day')}
                    </div>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalBricks')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{totalBricks.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium">{t('totalEarned')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                (*{t('estBasedOnProduction')})
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">{t('productionHistory')}</h3>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead className="text-right">{t('quantity')}</TableHead>
                                    <TableHead className="text-right">{t('rate')}</TableHead>
                                    <TableHead className="text-right">{t('total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workerProduction.length > 0 ? (
                                    workerProduction.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(new Date(p.date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="text-right font-medium">{p.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(p.rate_per_brick)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(p.quantity * p.rate_per_brick)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                            {t('noData')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
