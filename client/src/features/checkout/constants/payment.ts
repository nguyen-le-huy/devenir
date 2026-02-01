/**
 * Payment Constants
 * Centralized constants for payment methods, currencies, and pricing
 */

/**
 * Available payment methods
 */
export const PAYMENT_METHODS = {
    PAYOS: 'payos',
    NOWPAYMENTS: 'nowpayments',
} as const;

export type PaymentMethodValue = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

/**
 * Payment method labels for UI display
 */
export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.PAYOS]: 'PayOS',
    [PAYMENT_METHODS.NOWPAYMENTS]: 'NowPayments',
} as const;

/**
 * Payment method descriptions
 */
export const PAYMENT_METHOD_DESCRIPTIONS = {
    [PAYMENT_METHODS.PAYOS]: 'Local bank & e-wallet payment (Vietnam)',
    [PAYMENT_METHODS.NOWPAYMENTS]: 'Pay with USDT (BSC / BEP20)',
} as const;

/**
 * Payment method icons
 */
export const PAYMENT_METHOD_ICONS = {
    [PAYMENT_METHODS.PAYOS]: '/images/payos.png',
    [PAYMENT_METHODS.NOWPAYMENTS]: '/images/nowpayments.png',
} as const;

/**
 * Supported currencies
 */
export const CURRENCIES = {
    USD: 'USD',
    VND: 'VND',
    USDT: 'USDT',
} as const;

export type CurrencyValue = typeof CURRENCIES[keyof typeof CURRENCIES];

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS = {
    [CURRENCIES.USD]: '$',
    [CURRENCIES.VND]: '₫',
    [CURRENCIES.USDT]: 'USDT',
} as const;

/**
 * Gift code special pricing (when gift code is applied)
 * These are fixed promotional prices
 */
export const GIFT_CODE_PRICES = {
    [PAYMENT_METHODS.PAYOS]: {
        amount: 5000,
        currency: CURRENCIES.VND,
        formatted: '5,000 VND',
    },
    [PAYMENT_METHODS.NOWPAYMENTS]: {
        amount: 0.1,
        currency: CURRENCIES.USDT,
        formatted: '0.1 USDT',
    },
} as const;

/**
 * Payment method availability by shipping method
 */
export const PAYMENT_METHOD_AVAILABILITY = {
    [PAYMENT_METHODS.PAYOS]: {
        requiresHomeDelivery: true,
        availableCountries: ['Vietnam'],
    },
    [PAYMENT_METHODS.NOWPAYMENTS]: {
        requiresHomeDelivery: true,
        availableCountries: ['*'], // Available worldwide
    },
} as const;

/**
 * Payment processing timeout in milliseconds
 */
export const PAYMENT_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Payment redirect delay in milliseconds
 */
export const PAYMENT_REDIRECT_DELAY_MS = 1000; // 1 second
