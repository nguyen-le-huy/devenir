import { format } from 'date-fns';

/**
 * Format a date string or Date object to a standard display format.
 * Default format: 'MMM d, yyyy' (e.g., Oct 14, 2023)
 */
export const formatDate = (
    date: string | Date | undefined | null,
    pattern: string = 'MMM d, yyyy'
): string => {
    if (!date) return '—';
    try {
        return format(new Date(date), pattern);
    } catch (error) {
        console.error('Invalid date format:', date);
        return 'Invalid Date';
    }
};

/**
 * Format a number as currency (USD).
 */
export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return '—';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};
