/**
 * React Query Configuration
 * Default configurations for checkout queries and mutations
 */

import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

/**
 * Default stale time for static data (5 minutes)
 */
export const STALE_TIME_STATIC = 5 * 60 * 1000;

/**
 * Default stale time for realtime data (30 seconds)
 */
export const STALE_TIME_REALTIME = 30 * 1000;

/**
 * Default garbage collection time (10 minutes)
 */
export const GC_TIME = 10 * 60 * 1000;

/**
 * Default retry count for failed queries
 */
export const RETRY_COUNT = 3;

/**
 * Default retry delay (exponential backoff)
 */
export const RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

/**
 * Default query options for shipping address
 */
export const shippingAddressQueryOptions: Partial<UseQueryOptions> = {
    staleTime: STALE_TIME_STATIC,
    gcTime: GC_TIME,
    retry: false, // Don't retry for address queries (might be 404 if no address saved)
    refetchOnWindowFocus: false,
};

/**
 * Default query options for gift code validation
 */
export const giftCodeQueryOptions: Partial<UseQueryOptions> = {
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
    retry: false,
    enabled: false, // Manual trigger only
};

/**
 * Default query options for payment status
 */
export const paymentStatusQueryOptions: Partial<UseQueryOptions> = {
    staleTime: STALE_TIME_REALTIME,
    gcTime: GC_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
    refetchInterval: 5000, // Poll every 5 seconds for payment status
};

/**
 * Default query options for recommended products
 */
export const recommendedProductsQueryOptions: Partial<UseQueryOptions> = {
    staleTime: STALE_TIME_STATIC,
    gcTime: GC_TIME,
    retry: RETRY_COUNT,
    retryDelay: RETRY_DELAY,
};

/**
 * Default mutation options for address operations
 */
export const addressMutationOptions: Partial<UseMutationOptions> = {
    retry: false, // Don't retry mutations automatically
};

/**
 * Default mutation options for payment operations
 */
export const paymentMutationOptions: Partial<UseMutationOptions> = {
    retry: false,
};
