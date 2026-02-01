/**
 * Cart Feature Constants
 * Centralized configuration and constant values
 */

/**
 * React Query cache configuration for cart
 */
export const CART_CONFIG = {
    STALE_TIME: 30_000, // 30 seconds - cart data is realtime
    GC_TIME: 60_000,    // 1 minute - keep in cache for quick navigation
} as const;

/**
 * Available size options for products
 */
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'] as const;

/**
 * Toast notification messages
 */
export const TOAST_MESSAGES = {
    ADD_SUCCESS: 'Added to cart',
    UPDATE_SUCCESS: 'Cart updated',
    REMOVE_SUCCESS: 'Item removed',
    CLEAR_SUCCESS: 'Cart cleared',
    ERROR: 'Failed to update cart',
    ADD_ERROR: 'Failed to add item to cart',
    UPDATE_ERROR: 'Failed to update quantity',
    REMOVE_ERROR: 'Failed to remove item',
    CLEAR_ERROR: 'Failed to clear cart',
} as const;

/**
 * Type helper for size options
 */
export type SizeOption = typeof SIZE_OPTIONS[number];
