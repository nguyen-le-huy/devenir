/**
 * React Query Key Factory
 * Centralized query key management for checkout feature
 * 
 * Benefits:
 * - Type-safe query keys
 * - Easy invalidation
 * - Consistent naming
 * - Better cache management
 */

/**
 * Checkout query keys factory
 * Hierarchical structure for easy invalidation
 */
export const checkoutQueryKeys = {
    /**
     * Base key for all checkout queries
     */
    all: ['checkout'] as const,

    /**
     * Shipping-related queries
     */
    shipping: {
        all: () => [...checkoutQueryKeys.all, 'shipping'] as const,
        address: () => [...checkoutQueryKeys.shipping.all(), 'address'] as const,
        methods: () => [...checkoutQueryKeys.shipping.all(), 'methods'] as const,
    },

    /**
     * Gift code-related queries
     */
    giftCode: {
        all: () => [...checkoutQueryKeys.all, 'giftCode'] as const,
        validate: (code: string) => [...checkoutQueryKeys.giftCode.all(), 'validate', code] as const,
    },

    /**
     * Payment-related queries
     */
    payment: {
        all: () => [...checkoutQueryKeys.all, 'payment'] as const,
        session: (sessionId: string) => [...checkoutQueryKeys.payment.all(), 'session', sessionId] as const,
        status: (orderId: string) => [...checkoutQueryKeys.payment.all(), 'status', orderId] as const,
    },

    /**
     * Recommended products queries
     */
    recommendations: {
        all: () => [...checkoutQueryKeys.all, 'recommendations'] as const,
        products: (limit: number) => [...checkoutQueryKeys.recommendations.all(), 'products', limit] as const,
    },
} as const;

/**
 * Helper function to invalidate all checkout queries
 * @param queryClient - React Query client instance
 */
export const invalidateAllCheckoutQueries = (queryClient: { invalidateQueries: (options: { queryKey: readonly string[] }) => void }) => {
    return queryClient.invalidateQueries({ queryKey: checkoutQueryKeys.all });
};

/**
 * Helper function to invalidate shipping queries
 * @param queryClient - React Query client instance
 */
export const invalidateShippingQueries = (queryClient: { invalidateQueries: (options: { queryKey: readonly string[] }) => void }) => {
    return queryClient.invalidateQueries({ queryKey: checkoutQueryKeys.shipping.all() });
};

/**
 * Helper function to invalidate payment queries
 * @param queryClient - React Query client instance
 */
export const invalidatePaymentQueries = (queryClient: { invalidateQueries: (options: { queryKey: readonly string[] }) => void }) => {
    return queryClient.invalidateQueries({ queryKey: checkoutQueryKeys.payment.all() });
};
