/**
 * Cart Query Keys Factory
 * 
 * Centralized query key management for React Query.
 * Extends the global queryKeys.cart pattern.
 * 
 * @module features/cart/lib/queryKeys
 */

/**
 * Cart-specific query keys factory
 * 
 * Usage:
 * ```ts
 * // In hooks
 * useQuery({ queryKey: cartQueryKeys.detail() })
 * 
 * // Invalidate all cart queries
 * queryClient.invalidateQueries({ queryKey: cartQueryKeys.all })
 * 
 * // Invalidate specific cart detail
 * queryClient.invalidateQueries({ queryKey: cartQueryKeys.detail() })
 * ```
 */
export const cartQueryKeys = {
    /**
     * Base key for all cart-related queries
     */
    all: ['cart'] as const,

    /**
     * Key for cart detail query (current user's cart)
     */
    detail: () => [...cartQueryKeys.all, 'detail'] as const,

    /**
     * Key for product variants query (used in EditItem)
     * @param productId - Product ID to fetch variants for
     */
    variants: (productId: string) => ['variants', productId] as const,
} as const;
