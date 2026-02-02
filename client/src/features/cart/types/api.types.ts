/**
 * Cart API Types
 * 
 * Strict type definitions for API responses and payloads.
 * Includes type guards for runtime type safety.
 * 
 * @module features/cart/types/api
 */

import { ICart, IProductVariant } from './index';

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

/**
 * Cart API Response type
 */
export type CartApiResponse = ApiResponse<ICart>;

/**
 * Product Variants API Response type
 */
export type VariantsApiResponse = ApiResponse<IProductVariant[]>;

/**
 * Type guard for Cart API Response
 * 
 * @param data - Data to check
 * @returns True if data matches CartApiResponse shape
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/cart');
 * const data = await response.json();
 * 
 * if (isCartResponse(data)) {
 *   console.log('Cart items:', data.data.items);
 * } else {
 *   console.error('Invalid cart response');
 * }
 * ```
 */
export const isCartResponse = (data: unknown): data is CartApiResponse => {
    if (typeof data !== 'object' || data === null) return false;

    const response = data as Record<string, unknown>;

    return (
        typeof response.success === 'boolean' &&
        typeof response.data === 'object' &&
        response.data !== null &&
        'items' in response.data &&
        Array.isArray((response.data as Record<string, unknown>).items)
    );
};

/**
 * Type guard for Variants API Response
 * 
 * @param data - Data to check
 * @returns True if data matches VariantsApiResponse shape
 */
export const isVariantsResponse = (data: unknown): data is VariantsApiResponse => {
    if (typeof data !== 'object' || data === null) return false;

    const response = data as Record<string, unknown>;

    return (
        typeof response.success === 'boolean' &&
        typeof response.data === 'object' &&
        response.data !== null &&
        Array.isArray(response.data)
    );
};

/**
 * Error response from API
 */
export interface ApiErrorResponse {
    success: false;
    message: string;
    error?: {
        code: string;
        details?: unknown;
    };
}

/**
 * Type guard for API Error Response
 */
export const isApiErrorResponse = (data: unknown): data is ApiErrorResponse => {
    if (typeof data !== 'object' || data === null) return false;

    const response = data as Record<string, unknown>;

    return response.success === false && typeof response.message === 'string';
};
