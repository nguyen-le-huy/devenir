/**
 * Formatting Utilities
 * Helper functions for formatting prices, dates, and other display values
 */

import type { CurrencyValue } from '../constants/payment';
import type { DeliveryTime } from '../types/form';
import { CURRENCIES, CURRENCY_SYMBOLS } from '../constants/payment';
import { SHIPPING_COSTS, DELIVERY_ESTIMATES, DELIVERY_TIMES } from '../constants/shipping';

/**
 * Format price with currency
 * @param amount - Numeric amount
 * @param currency - Currency code
 * @returns Formatted price string
 */
export const formatPrice = (amount: number, currency: CurrencyValue): string => {
    switch (currency) {
        case CURRENCIES.USD:
            return `USD ${amount.toFixed(2)}`;

        case CURRENCIES.USDT:
            return `${amount.toFixed(2)} ${CURRENCIES.USDT}`;

        case CURRENCIES.VND:
            return `${amount.toLocaleString('vi-VN')} ${CURRENCIES.VND}`;

        default:
            return `${amount.toFixed(2)}`;
    }
};

/**
 * Format price with currency symbol
 * @param amount - Numeric amount
 * @param currency - Currency code
 * @returns Formatted price with symbol
 */
export const formatPriceWithSymbol = (amount: number, currency: CurrencyValue): string => {
    const symbol = CURRENCY_SYMBOLS[currency];

    switch (currency) {
        case CURRENCIES.VND:
            return `${symbol}${amount.toLocaleString('vi-VN')}`;

        case CURRENCIES.USDT:
            return `${amount.toFixed(2)} ${symbol}`;

        case CURRENCIES.USD:
        default:
            return `${symbol}${amount.toFixed(2)}`;
    }
};

/**
 * Calculate shipping cost based on delivery time
 * @param deliveryTime - Selected delivery time
 * @returns Shipping cost in USD
 */
export const calculateShippingCost = (deliveryTime: DeliveryTime): number => {
    if (!deliveryTime) return 0;

    // Type guard to ensure deliveryTime is a valid key
    if (deliveryTime === DELIVERY_TIMES.STANDARD ||
        deliveryTime === DELIVERY_TIMES.NEXT_DAY ||
        deliveryTime === DELIVERY_TIMES.NOMINATED) {
        return SHIPPING_COSTS[deliveryTime];
    }

    return 0;
};

/**
 * Format shipping cost for display
 * @param deliveryTime - Selected delivery time
 * @returns Formatted shipping cost or "Free"
 */
export const formatShippingCost = (deliveryTime: DeliveryTime): string => {
    const cost = calculateShippingCost(deliveryTime);
    return cost > 0 ? formatPrice(cost, CURRENCIES.USD) : 'Free';
};

/**
 * Calculate total price including shipping
 * @param subtotal - Cart subtotal
 * @param deliveryTime - Selected delivery time
 * @returns Total price including shipping
 */
export const calculateTotal = (subtotal: number, deliveryTime: DeliveryTime): number => {
    const shippingCost = calculateShippingCost(deliveryTime);
    return subtotal + shippingCost;
};

/**
 * Format delivery estimate for display
 * @param deliveryTime - Selected delivery time
 * @returns Formatted delivery estimate string
 */
export const formatDeliveryEstimate = (deliveryTime: DeliveryTime): string => {
    if (!deliveryTime) return '';

    // Type guard
    if (deliveryTime === DELIVERY_TIMES.STANDARD ||
        deliveryTime === DELIVERY_TIMES.NEXT_DAY ||
        deliveryTime === DELIVERY_TIMES.NOMINATED) {
        return DELIVERY_ESTIMATES[deliveryTime].label;
    }

    return '';
};

/**
 * Calculate estimated delivery date range
 * @param deliveryTime - Selected delivery time
 * @param fromDate - Starting date (defaults to today)
 * @returns Object with min and max delivery dates
 */
export const calculateDeliveryDateRange = (
    deliveryTime: DeliveryTime,
    fromDate: Date = new Date()
): { minDate: Date; maxDate: Date } => {
    // Type guard
    let estimate;
    if (deliveryTime === DELIVERY_TIMES.STANDARD ||
        deliveryTime === DELIVERY_TIMES.NEXT_DAY ||
        deliveryTime === DELIVERY_TIMES.NOMINATED) {
        estimate = DELIVERY_ESTIMATES[deliveryTime];
    }

    if (!estimate) {
        return { minDate: fromDate, maxDate: fromDate };
    }

    const minDate = new Date(fromDate);
    minDate.setDate(minDate.getDate() + estimate.min);

    const maxDate = new Date(fromDate);
    maxDate.setDate(maxDate.getDate() + estimate.max);

    return { minDate, maxDate };
};

/**
 * Format date for display
 * @param date - Date to format
 * @param locale - Locale for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (date: Date, locale: string = 'en-US'): string => {
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

/**
 * Format delivery date range for display
 * @param deliveryTime - Selected delivery time
 * @param fromDate - Starting date (defaults to today)
 * @param locale - Locale for formatting
 * @returns Formatted date range string
 */
export const formatDeliveryDateRange = (
    deliveryTime: DeliveryTime,
    fromDate: Date = new Date(),
    locale: string = 'en-US'
): string => {
    const { minDate, maxDate } = calculateDeliveryDateRange(deliveryTime, fromDate);

    if (minDate.getTime() === maxDate.getTime()) {
        return formatDate(minDate, locale);
    }

    return `${formatDate(minDate, locale)} - ${formatDate(maxDate, locale)}`;
};

/**
 * Format phone number for display
 * @param phone - Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format based on length
    if (cleaned.length === 10) {
        // Format: (XXX) XXX-XXXX
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
        // Format: +1 (XXX) XXX-XXXX
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }

    // Return original if format not recognized
    return phone;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
};

/**
 * Format full name from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name
 */
export const formatFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`.trim();
};

/**
 * Parse full name into first and last name
 * @param fullName - Full name string
 * @returns Object with firstName and lastName
 */
export const parseFullName = (fullName: string): { firstName: string; lastName: string } => {
    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) {
        return { firstName: '', lastName: '' };
    }

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }

    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    return { firstName, lastName };
};
