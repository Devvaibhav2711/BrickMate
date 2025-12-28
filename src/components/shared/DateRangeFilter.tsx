import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export type DateRange = {
    from: Date | undefined;
    to: Date | undefined;
};

interface DateRangeFilterProps {
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    className?: string;
}

export function DateRangeFilter({ dateRange, setDateRange, className }: DateRangeFilterProps) {
    const { t } = useLanguage();
    const [filterType, setFilterType] = useState('all');

    // Handle preset selection
    const handlePresetChange = (value: string) => {
        setFilterType(value);
        const today = new Date();

        switch (value) {
            case 'today':
                setDateRange({ from: today, to: today });
                break;
            case 'yesterday':
                const yest = subDays(today, 1);
                setDateRange({ from: yest, to: yest });
                break;
            case 'thisWeek':
                setDateRange({ from: startOfWeek(today), to: endOfWeek(today) });
                break;
            case 'lastWeek':
                const lastWeekStart = startOfWeek(subDays(today, 7));
                const lastWeekEnd = endOfWeek(subDays(today, 7));
                setDateRange({ from: lastWeekStart, to: lastWeekEnd });
                break;
            case 'thisMonth':
                setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
                break;
            case 'lastMonth':
                const lastMonthStart = startOfMonth(subMonths(today, 1));
                const lastMonthEnd = endOfMonth(subMonths(today, 1));
                setDateRange({ from: lastMonthStart, to: lastMonthEnd });
                break;
            case 'all':
                setDateRange({ from: undefined, to: undefined });
                break;
            default:
                break;
        }
    };

    return (
        <div className={cn("flex gap-2 items-center", className)}>
            <Select value={filterType} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="today">{t('today')}</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="lastWeek">Last Week</SelectItem>
                    <SelectItem value="thisMonth">{t('thisMonth')}</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
            </Select>

            {/* Optional: Custom Range Picker if needed later */}
            {/* 
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange as any} // Radix UI Calendar types mismatch slightly
            onSelect={(range: any) => setDateRange(range)}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      */}
        </div>
    );
}
