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
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [startMonth, setStartMonth] = useState<string>('9'); // Default October (Index 9)

    const isAllTime = selectedYear === 'all';
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (!isAllTime) {
        const y = parseInt(selectedYear);
        const m = parseInt(startMonth);
        // Start date: 1st of startMonth, selectedYear
        startDate = new Date(y, m, 1).toISOString().split('T')[0];
        // End Date: 1st of startMonth, selectedYear + 1
        endDate = new Date(y + 1, m, 1).toISOString().split('T')[0];
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
