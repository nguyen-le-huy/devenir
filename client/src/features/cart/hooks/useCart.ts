import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '@/features/cart/api/cartService';
import { trackingService } from '@/core/services/trackingService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { ICart, ICartResponse } from '../types';
import { toast } from 'sonner';
import { logger } from '@/shared/utils/logger';

// Query keys for cart - unified
export const cartKeys = {
    all: ['cart'] as const,
    detail: () => [...cartKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch current user's cart
 * Only enabled when user is authenticated
 */
export const useCart = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    return useQuery<ICartResponse, Error, ICart>({
        queryKey: cartKeys.detail(),
        queryFn: cartService.getCart,
        enabled: isAuthenticated && !!token,
        staleTime: 30 * 1000, // 30 seconds
        select: (response) => response.data,
    });
};

/**
 * Hook to add item to cart with Optimistic Updates
 */
export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }) =>
            cartService.addToCart(variantId, quantity),

        onMutate: async () => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: cartKeys.detail() });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData<ICart>(cartKeys.detail());

            // Optimistically update to the new value
            if (previousCart) {
                // This is a simplified optimistic update. 
                // A full one would need product details which we might not have here without fetching.
                // For "Add", we often just rely on "fast server response" or complex logic if we have product data handy.
                // However, let's at least protect the UI from feeling broken.
                // Ideally we would push a temp item, but without product info (image, name) it looks bad.
                // Strategy: We will rely on loading states or fast invalidation mostly for Add, 
                // UNLESS we pass full product object to this hook (which is better).
                // For now, let's keep it simple: invalidate is safer for ADD unless we refactor to pass full product.
            }

            return { previousCart };
        },

        onSuccess: (response, variables) => {
            const data = response.data;
            // Track add to cart event
            if (data?.items) {
                const addedItem = data.items.find((item) => item.productVariant?._id === variables.variantId);

                if (addedItem) {
                    const variant = addedItem.productVariant;
                    const product = variant?.product_id;

                    if (product && variant) {
                        trackingService.trackCartAction('add', {
                            productId: product._id,
                            productName: product.name,
                            quantity: variables.quantity || 1,
                            price: variant.salePrice || variant.basePrice || variant.price || 0,
                            size: variant.size,
                            color: typeof variant.color === 'string' ? variant.color : variant.color?.name
                        });
                    }
                }
            }
            toast.success('Added to cart');
            // Always refetch after error or success to ensure server state sync
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error, _, context) => {
            logger.error('Failed to add item to cart', error);
            toast.error('Failed to add item to cart');
            // Rollback
            if (context?.previousCart) {
                queryClient.setQueryData(cartKeys.detail(), context.previousCart);
            }
        },
    });
};

/**
 * Hook to update cart item quantity with Optimistic Updates
 */
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
            cartService.updateCartItem(variantId, quantity),

        onMutate: async ({ variantId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartKeys.detail());

            if (previousCart) {
                const currentItems = previousCart.items || [];
                const newItems = currentItems.map(item => {
                    if (item.productVariant._id === variantId) {
                        return { ...item, quantity };
                    }
                    return item;
                });

                // Recalculate totals (approximate)
                const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
                const totalPrice = newItems.reduce((acc, item) => {
                    const price = item.productVariant.salePrice || item.productVariant.price || 0;
                    return acc + (price * item.quantity);
                }, 0);

                queryClient.setQueryData<ICart>(cartKeys.detail(), {
                    ...previousCart,
                    items: newItems,
                    totalItems,
                    totalPrice
                });
            }

            return { previousCart };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error, _, context) => {
            logger.error('Failed to update cart item', error);
            toast.error('Failed to update quantity');
            if (context?.previousCart) {
                queryClient.setQueryData(cartKeys.detail(), context.previousCart);
            }
        },
    });
};

/**
 * Hook to remove item from cart with Optimistic Updates
 */
export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variantId: string) => cartService.removeFromCart(variantId),

        onMutate: async (variantId) => {
            await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartKeys.detail());

            if (previousCart) {
                const currentItems = previousCart.items || [];
                const newItems = currentItems.filter(item => item.productVariant._id !== variantId);

                // Recalculate totals
                const totalItems = newItems.reduce((acc, item) => acc + item.quantity, 0);
                const totalPrice = newItems.reduce((acc, item) => {
                    const price = item.productVariant.salePrice || item.productVariant.price || 0;
                    return acc + (price * item.quantity);
                }, 0);

                queryClient.setQueryData<ICart>(cartKeys.detail(), {
                    ...previousCart,
                    items: newItems,
                    totalItems,
                    totalPrice
                });
            }

            return { previousCart };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
            toast.success('Item removed');
        },
        onError: (error, _, context) => {
            logger.error('Failed to remove item from cart', error);
            toast.error('Failed to remove item');
            if (context?.previousCart) {
                queryClient.setQueryData(cartKeys.detail(), context.previousCart);
            }
        },
    });
};

/**
 * Hook to clear entire cart with Optimistic Updates
 */
export const useClearCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cartService.clearCart,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: cartKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartKeys.detail());

            if (previousCart) {
                queryClient.setQueryData<ICart>(cartKeys.detail(), {
                    ...previousCart,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0
                });
            }

            return { previousCart };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error, _, context) => {
            logger.error('Failed to clear cart', error);
            toast.error('Failed to clear cart');
            if (context?.previousCart) {
                queryClient.setQueryData(cartKeys.detail(), context.previousCart);
            }
        },
    });
};
