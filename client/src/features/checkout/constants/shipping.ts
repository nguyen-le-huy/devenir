/**
 * Shipping Constants
 * Centralized constants for shipping methods, delivery times, and costs
 */

/**
 * Available shipping methods
 */
export const SHIPPING_METHODS = {
    HOME: 'home',
    STORE: 'store',
} as const;

export type ShippingMethodValue = typeof SHIPPING_METHODS[keyof typeof SHIPPING_METHODS];

/**
 * Available delivery time options
 */
export const DELIVERY_TIMES = {
    STANDARD: 'standard',
    NEXT_DAY: 'next',
    NOMINATED: 'nominated',
} as const;

export type DeliveryTimeValue = typeof DELIVERY_TIMES[keyof typeof DELIVERY_TIMES];

/**
 * Shipping costs in USD for each delivery time option
 */
export const SHIPPING_COSTS = {
    [DELIVERY_TIMES.STANDARD]: 0,
    [DELIVERY_TIMES.NEXT_DAY]: 5,
    [DELIVERY_TIMES.NOMINATED]: 10,
} as const;

/**
 * Delivery time labels for UI display
 */
export const DELIVERY_TIME_LABELS = {
    [DELIVERY_TIMES.STANDARD]: 'Standard delivery',
    [DELIVERY_TIMES.NEXT_DAY]: 'Next day delivery',
    [DELIVERY_TIMES.NOMINATED]: 'Nominated day delivery',
} as const;

/**
 * Shipping method labels for UI display
 */
export const SHIPPING_METHOD_LABELS = {
    [SHIPPING_METHODS.HOME]: 'Home delivery',
    [SHIPPING_METHODS.STORE]: 'Collect in store',
} as const;

/**
 * Estimated delivery days for each delivery time option
 */
export const DELIVERY_ESTIMATES = {
    [DELIVERY_TIMES.STANDARD]: {
        min: 2,
        max: 4,
        label: 'Estimated delivery: 2-4 business days',
    },
    [DELIVERY_TIMES.NEXT_DAY]: {
        min: 1,
        max: 1,
        label: 'Estimated delivery: Next business day',
    },
    [DELIVERY_TIMES.NOMINATED]: {
        min: 1,
        max: 7,
        label: 'Choose a day that suits you',
    },
} as const;

/**
 * Store collection availability status
 */
export const STORE_COLLECTION_AVAILABLE = false;

/**
 * Default country for shipping
 */
export const DEFAULT_SHIPPING_COUNTRY = 'Vietnam';
