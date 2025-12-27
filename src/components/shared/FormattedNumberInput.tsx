import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface FormattedNumberInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
    value: number | string;
    onChange: (value: number) => void;
}

export const FormattedNumberInput = ({ value, onChange, className, ...props }: FormattedNumberInputProps) => {
    const [displayValue, setDisplayValue] = useState('');

    // Update display value when parent value changes externally
    useEffect(() => {
        if (value === '' || value === undefined || value === null) {
            setDisplayValue('');
        } else {
            const numVal = Number(value);
            if (!isNaN(numVal)) {
                setDisplayValue(new Intl.NumberFormat('en-IN').format(numVal));
            }
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Remove commas to get raw number
        const rawValue = inputValue.replace(/,/g, '');

        // Allow empty input
        if (rawValue === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        // Check if it's a valid number (integer or decimal)
        // Allows "123", "123.", "123.45"
        if (!/^\d*\.?\d*$/.test(rawValue)) {
            return; // Ignore non-numeric input
        }

        // Handle the case where user types the decimal point
        if (rawValue.endsWith('.')) {
            setDisplayValue(new Intl.NumberFormat('en-IN').format(Number(rawValue.slice(0, -1))) + '.');
            // We can't really pass "123." as a number to onChange, so we pass 123
            onChange(Number(rawValue));
            return;
        }

        // Handle decimal places partially typed (e.g. "123.4")
        if (rawValue.includes('.')) {
            const [integerPart, decimalPart] = rawValue.split('.');
            const formattedInteger = new Intl.NumberFormat('en-IN').format(Number(integerPart));
            setDisplayValue(`${formattedInteger}.${decimalPart}`);
            onChange(Number(rawValue));
            return;
        }

        const numValue = Number(rawValue);

        // Update parent with number
        onChange(numValue);

        // Update local display with formatting
        setDisplayValue(new Intl.NumberFormat('en-IN').format(numValue));
    };

    return (
        <Input
            {...props}
            type="text" // Must be text to support commas
            value={displayValue}
            onChange={handleChange}
            className={className}
            inputMode="numeric" // Shows numeric keyboard on mobile
        />
    );
};
