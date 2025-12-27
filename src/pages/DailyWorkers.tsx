import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLabour, useAddWagePayment } from '@/hooks/useLabour';
import { useAttendance, useMarkAttendance } from '@/hooks/useAttendance';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Plus, Edit2 } from 'lucide-react';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';
import { formatCurrency } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AddLabourDialog } from '@/components/labour/AddLabourDialog';

// Sub-component for Popover Content to handle local state
const AttendanceAction = ({
    workerId,
    date,
    currentWage,
    onSelect,
    onClose
}: {
    workerId: string,
    date: Date,
    currentWage: number,
    onSelect: (workerId: string, date: Date, status: 'Present' | 'Half' | 'Absent', wage: number) => void,
    onClose?: () => void
}) => {
    const [manualWage, setManualWage] = useState<string>(currentWage.toString());

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
                <Label className="text-xs text-muted-foreground w-12">Rate:</Label>
                <Input
                    className="h-7 text-xs"
                    value={manualWage}
                    onChange={(e) => setManualWage(e.target.value)}
                    type="number"
                />
            </div>
            <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-8"
                onClick={() => {
                    onSelect(workerId, date, 'Present', parseFloat(manualWage) || 0);
                    onClose?.(); // Close popover if prop provided (optional depending on implementation)
                }}
            >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Full Day
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-8"
                onClick={() => {
                    onSelect(workerId, date, 'Half', parseFloat(manualWage) || 0);
                    onClose?.();
                }}
            >
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                Half Day
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                    onSelect(workerId, date, 'Absent', 0);
                    onClose?.();
                }}
            >
                <div className="w-2 h-2 rounded-full border border-muted-foreground/30" />
                Absent
            </Button>
        </div>
    );
};

export const DailyWorkers = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // 1. Weekly Logic Only - Current Date determines the week
    const [currentDate, setCurrentDate] = useState(new Date());

    // Week Navigation
    const handleWeekChange = (direction: 'next' | 'prev') => {
        if (direction === 'next') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(subWeeks(currentDate, 1));
    };

    // Calculate dates for the current week (Monday start)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    // Generate array of 7 days for the table header
    const daysToDisplay = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // 2. Data Fetching
    const { data: workers, isLoading: workersLoading } = useLabour();
    const { data: attendance, isLoading: attendanceLoading } = useAttendance(weekStart, weekEnd);
    const markAttendance = useMarkAttendance();
    const addWagePayment = useAddWagePayment();

    // 3. UI States
    const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);

    // Payment Dialog State
    const [paymentDialog, setPaymentDialog] = useState<{
        isOpen: boolean;
        workerId: string | null;
        totalEarned: number;
        paidAmount: number;
        remainingAmount: number;
        workerName: string;
    }>({
        isOpen: false,
        workerId: null,
        totalEarned: 0,
        paidAmount: 0,
        remainingAmount: 0,
        workerName: ''
    });
    const [paymentAmount, setPaymentAmount] = useState<string>('0');


    // 4. Handlers

    // Professional Attendance Popover Handler
    const handleStatusSelect = (workerId: string, date: Date, status: 'Present' | 'Half' | 'Absent', dailyWage: number) => {
        const dateStr = format(date, 'yyyy-MM-dd');

        let shouldMarkPresent = false;
        let description = '';

        if (status === 'Present') {
            shouldMarkPresent = true;
            description = `Full Day|${dailyWage}`;
        } else if (status === 'Half') {
            shouldMarkPresent = true;
            description = `Half Day|${dailyWage / 2}`;
        } else {
            // Absent
            shouldMarkPresent = false;
            description = ''; // Or null, handled by hook
        }

        markAttendance.mutate({
            labour_id: workerId,
            date: dateStr,
            is_present: shouldMarkPresent,
            description: shouldMarkPresent ? description : null
        });
    };

    // Payment Logic
    const openPaymentDialog = (worker: any, earned: number, paid: number) => {
        const remaining = earned - paid;
        setPaymentDialog({
            isOpen: true,
            workerId: worker.id,
            workerName: worker.name,
            totalEarned: earned,
            paidAmount: paid,
            remainingAmount: remaining
        });
        setPaymentAmount(remaining.toString());
    };

    const handleConfirmPayment = () => {
        if (!paymentDialog.workerId) return;

        const amount = parseFloat(paymentAmount);
        if (amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        addWagePayment.mutate({
            labour_id: paymentDialog.workerId,
            amount: amount,
            notes: `Payment for Week ${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM')}`,
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            period_start: weekStartStr,
            period_end: weekEndStr,
        });

        setPaymentDialog(prev => ({ ...prev, isOpen: false }));
    };


    if (workersLoading || attendanceLoading) return <PageLoader />;

    return (
        <div className="p-4 md:p-8 space-y-6 bg-background min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('dailyWorkers')}</h1>
                    <p className="text-muted-foreground">{t('attendance')}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Week Navigation */}
                    <div className="flex items-center gap-2 bg-card p-1 rounded-md border shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => handleWeekChange('prev')}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium min-w-[140px] text-center">
                                {format(weekStart, 'dd MMM')} - {format(weekEnd, 'dd MMM')}
                            </span>
                        </div>

                        <Button variant="ghost" size="icon" onClick={() => handleWeekChange('next')}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button onClick={() => setIsAddWorkerOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('addLabour')}
                    </Button>
                </div>
            </div>

            {/* Attendance Table */}
            <Card className="overflow-hidden border-none shadow-md">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[180px] sticky left-0 bg-background z-20 font-bold">{t('labourName')}</TableHead>
                                    <TableHead className="w-[80px] text-center font-bold text-primary">{t('totalDays')}</TableHead>

                                    {daysToDisplay.map(day => (
                                        <TableHead key={day.toString()} className="min-w-[60px] p-1 text-center">
                                            <div className="flex flex-col items-center justify-center p-1 rounded-md">
                                                <span className="text-xs font-semibold text-muted-foreground">{format(day, 'EEE')}</span>
                                                <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                                            </div>
                                        </TableHead>
                                    ))}

                                    <TableHead className="text-right bg-background font-bold min-w-[100px]">{t('weeklyEarnings')}</TableHead>
                                    <TableHead className="text-center bg-background font-bold min-w-[140px] sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workers?.filter(worker => {
                                    // 1. Check if Active (default to true if undefined)
                                    const isActive = worker.is_active !== false;

                                    // 2. Check for Activity in this specific week
                                    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
                                    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

                                    // Optimization: Check the 'attendance' array passed from useAttendance hook
                                    // consistently for current week data, rather than worker.attendance (which is now empty/summary)
                                    const hasAttendance = attendance?.some(a => a.labour_id === worker.id);

                                    const hasPayments = worker.wage_payments?.some(p =>
                                        p.period_start === weekStartStr && p.period_end === weekEndStr
                                    );

                                    // Show if Active OR has history in this week
                                    return isActive || hasAttendance || hasPayments;
                                }).map(worker => {
                                    // Attendance Filtering for this week
                                    const workerAttendance = attendance?.filter(a => a.labour_id === worker.id) || [];
                                    const displayedAttendance = workerAttendance.filter(a => {
                                        const d = new Date(a.date);
                                        return d >= weekStart && d <= weekEnd;
                                    });

                                    // Calculations
                                    const totalDays = displayedAttendance.filter(a => a.is_present).length;
                                    const weeklyEarnings = displayedAttendance.reduce((sum, record) => {
                                        if (!record.is_present || !record.description) return sum;
                                        const parts = record.description.split('|');
                                        return sum + (parts.length > 1 ? Number(parts[1]) : (worker.daily_wage || 0));
                                    }, 0);

                                    // Payment Logic
                                    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
                                    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

                                    const relevantPayments = worker.wage_payments?.filter(p =>
                                        p.period_start === weekStartStr && p.period_end === weekEndStr
                                    ) || [];

                                    const totalPaid = relevantPayments.reduce((sum, p) => sum + p.amount, 0);
                                    const remaining = weeklyEarnings - totalPaid;

                                    return (
                                        <TableRow key={worker.id} className="group hover:bg-muted/30">
                                            <TableCell
                                                className="font-medium sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] custom-cell-border cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigate(`/labour/${worker.id}`)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-foreground hover:underline hover:text-primary transition-all">{worker.name}</span>
                                                    <span className="text-[11px] text-muted-foreground">{formatCurrency(worker.daily_wage)}/day</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center font-bold text-primary text-base">
                                                {totalDays}
                                            </TableCell>

                                            {daysToDisplay.map(day => {
                                                const dateStr = format(day, 'yyyy-MM-dd');
                                                const record = workerAttendance.find(a => a.date === dateStr);
                                                const isPresent = record?.is_present || false;
                                                const isHalfDay = record?.description?.includes('Half Day');

                                                // Cell Style
                                                let cellClass = "bg-gray-50/50 hover:bg-gray-100";
                                                let indicatorClass = "opacity-0"; // Hidden by default (Absent)

                                                if (isPresent) {
                                                    if (isHalfDay) {
                                                        cellClass = "bg-orange-50 hover:bg-orange-100";
                                                        indicatorClass = "bg-orange-500 opacity-100";
                                                    } else {
                                                        cellClass = "bg-green-50 hover:bg-green-100";
                                                        indicatorClass = "bg-green-500 opacity-100";
                                                    }
                                                }

                                                return (
                                                    <TableCell key={day.toString()} className="p-1 text-center">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <div
                                                                    className={`w-full h-12 rounded-md cursor-pointer transition-all flex flex-col items-center justify-center gap-1 border border-transparent hover:border-border ${cellClass}`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full transition-all ${indicatorClass}`} />
                                                                    {isPresent && (
                                                                        <span className="text-[10px] font-medium text-muted-foreground">
                                                                            {isHalfDay ? '0.5' : '1.0'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-48 p-3" align="center">
                                                                <AttendanceAction
                                                                    workerId={worker.id}
                                                                    date={day}
                                                                    currentWage={worker.daily_wage || 0}
                                                                    onSelect={handleStatusSelect}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell className="text-right font-medium">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-green-700">{formatCurrency(weeklyEarnings)}</span>
                                                    {totalPaid > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">Paid: {formatCurrency(totalPaid)}</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-center sticky right-0 bg-background p-2 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] custom-cell-border">
                                                {weeklyEarnings === 0 ? (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                ) : remaining <= 0 ? (
                                                    <div className="flex flex-col items-center justify-center text-green-600">
                                                        <div className="flex items-center gap-1 font-bold">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span className="text-xs">{t('paid')}</span>
                                                        </div>
                                                        {totalPaid > weeklyEarnings && ( // Overpaid case
                                                            <span className="text-[10px] text-orange-600">Over: {formatCurrency(totalPaid - weeklyEarnings)}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant={totalPaid > 0 ? "secondary" : "default"}
                                                        className={`h-8 text-xs w-full ${totalPaid > 0 ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-primary text-primary-foreground'}`}
                                                        onClick={() => openPaymentDialog(worker, weeklyEarnings, totalPaid)}
                                                    >
                                                        {totalPaid > 0 ? 'Pay Rem.' : 'Pay'}
                                                    </Button>
                                                )}
                                                {remaining > 0 && totalPaid > 0 && (
                                                    <div className="text-[10px] text-orange-600 mt-1 font-medium">
                                                        Rem: {formatCurrency(remaining)}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Dialog */}
            <Dialog open={paymentDialog.isOpen} onOpenChange={(open) => !open && setPaymentDialog(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Make Weekly Payment</DialogTitle>
                        <DialogDescription>
                            Worker: <span className="font-semibold text-foreground">{paymentDialog.workerName}</span><br />
                            Week: {format(weekStart, 'dd MMM')} - {format(weekEnd, 'dd MMM')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-muted p-3 rounded-lg">
                                <span className="text-muted-foreground block">Total Earned</span>
                                <span className="text-lg font-bold">{formatCurrency(paymentDialog.totalEarned)}</span>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <span className="text-green-700 block">Already Paid</span>
                                <span className="text-lg font-bold text-green-700">{formatCurrency(paymentDialog.paidAmount)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Amount (₹)</Label>
                            <FormattedNumberInput
                                value={paymentAmount}
                                onChange={(val) => setPaymentAmount(val.toString())}
                                placeholder="Enter amount"
                            />
                            <p className="text-xs text-muted-foreground">
                                Max Remaining: <span className="font-medium text-foreground">{formatCurrency(paymentDialog.remainingAmount)}</span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleConfirmPayment}>
                            Pay {formatCurrency(Number(paymentAmount))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reuse Add Worker Dialog */}
            <AddLabourDialog open={isAddWorkerOpen} onOpenChange={setIsAddWorkerOpen} />

        </div >
    );
};
