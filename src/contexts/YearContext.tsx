import React, { createContext, useContext, useState, ReactNode } from 'react';

interface YearContextType {
    selectedYear: string;
    startMonth: string; // 0-11 as string
    setYear: (year: string) => void;
    setStartMonth: (month: string) => void;
    startDate: string | undefined;
    endDate: string | undefined;
    isAllTime: boolean;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

export const YearProvider = ({ children }: { children: ReactNode }) => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    // Smart Default: If Jan-Sept (0-8), select previous year (e.g. in Jan 2026, select 2025 start). Else select current year.
    const defaultYear = currentMonth < 9 ? (currentYear - 1).toString() : currentYear.toString();

    const [selectedYear, setSelectedYear] = useState<string>(defaultYear);
    const [startMonth, setStartMonth] = useState<string>('9'); // Default October (Index 9)

    const isAllTime = selectedYear === 'all';
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (!isAllTime) {
        const y = parseInt(selectedYear);
        const m = parseInt(startMonth);

        // Use UTC to avoid timezone shifts when grabbing the date string
        // Start date: 1st of startMonth (Oct), selectedYear
        startDate = new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];

        // End Date: 30th of May (Index 4) of next year
        endDate = new Date(Date.UTC(y + 1, 4, 30)).toISOString().split('T')[0];
    }

    return (
        <YearContext.Provider
            value={{
                selectedYear,
                startMonth,
                setYear: setSelectedYear,
                setStartMonth,
                startDate,
                endDate,
                isAllTime,
            }}
        >
            {children}
        </YearContext.Provider>
    );
};

export const useYearContext = () => {
    const context = useContext(YearContext);
    if (context === undefined) {
        throw new Error('useYearContext must be used within a YearProvider');
    }
    return context;
};
