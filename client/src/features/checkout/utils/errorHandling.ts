/**
 * Error Handling Utilities
 * Centralized error handling and parsing utilities
 */

import type { ApiError } from '../types/api';
import { VALIDATION_MESSAGES } from '../constants/validation';

/**
 * Parse unknown error into structured ApiError
 * @param error - Unknown error object
 * @returns Structured API error
 */
export const parseApiError = (error: unknown): ApiError => {
    // Handle Error instances
    if (error instanceof Error) {
        return {
            message: error.message,
        };
    }

    // Handle object-like errors (Axios errors, etc.)
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;

        return {
            message: (data?.message as string) || (err.message as string) || VALIDATION_MESSAGES.UNKNOWN_ERROR,
            code: data?.code as string | undefined,
            field: data?.field as string | undefined,
            details: data?.details as Record<string, unknown> | undefined,
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            message: error,
        };
    }

    // Fallback for unknown error types
    return {
        message: VALIDATION_MESSAGES.UNKNOWN_ERROR,
    };
};

/**
 * Handle API error and return user-friendly message
 * @param error - Unknown error object
 * @param fallbackMessage - Fallback message if error parsing fails
 * @returns User-friendly error message
 */
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
    const apiError = parseApiError(error);
    return apiError.message || fallbackMessage;
};

/**
 * Check if error is a network error
 * @param error - Unknown error object
 * @returns True if network error
 */
export const isNetworkError = (error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        return (
            err.code === 'ECONNABORTED' ||
            err.code === 'ERR_NETWORK' ||
            err.message === 'Network Error' ||
            !navigator.onLine
        );
    }
    return false;
};

/**
 * Check if error is a timeout error
 * @param error - Unknown error object
 * @returns True if timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        return err.code === 'ECONNABORTED' || err.code === 'ERR_TIMEOUT';
    }
    return false;
};

/**
 * Get appropriate error message based on error type
 * @param error - Unknown error object
 * @param context - Context for the error (e.g., 'saving address', 'processing payment')
 * @returns Contextual error message
 */
export const getContextualErrorMessage = (error: unknown, context: string): string => {
    if (isNetworkError(error)) {
        return VALIDATION_MESSAGES.NETWORK_ERROR;
    }

    if (isTimeoutError(error)) {
        return `Request timeout while ${context}. Please try again.`;
    }

    const apiError = parseApiError(error);

    // Check for specific HTTP status codes
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        const response = err.response as Record<string, unknown> | undefined;
        const status = response?.status as number | undefined;

        if (status === 401 || status === 403) {
            return 'Authentication required. Please log in and try again.';
        }

        if (status === 404) {
            return `Resource not found while ${context}.`;
        }

        if (status === 422) {
            return apiError.message || `Validation error while ${context}.`;
        }

        if (status && status >= 500) {
            return VALIDATION_MESSAGES.SERVER_ERROR;
        }
    }

    return apiError.message || `Failed to ${context}. Please try again.`;
};

/**
 * Log error for debugging (only in development)
 * @param error - Error to log
 * @param context - Context for the error
 */
export const logError = (error: unknown, context: string): void => {
    if (import.meta.env.DEV) {
        console.error(`[${context}]`, error);
    }
};

/**
 * Create error handler for React Query mutations
 * @param context - Context for the error
 * @param onError - Optional callback for additional error handling
 * @returns Error handler function
 */
export const createMutationErrorHandler = (
    context: string,
    onError?: (error: ApiError) => void
) => {
    return (error: unknown) => {
        const apiError = parseApiError(error);
        logError(error, context);
        onError?.(apiError);
    };
};
