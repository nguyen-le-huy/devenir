import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '@/features/cart/api/cartService';
import { trackingService } from '@/core/services/trackingService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { ICart, ICartResponse } from '../types';
import { toast } from 'sonner';
import { logger } from '@/shared/utils/logger';
import { cartQueryKeys } from '../lib/queryKeys';
import { CART_CONFIG, TOAST_MESSAGES } from '../utils/constants';
import {
    calculateCartTotals,
    getColorName,
    getVariantPrice,
} from '../utils/cartCalculations';
import { validateAddToCart, validateUpdateCartItem } from '../utils/cartValidation';
import { z } from 'zod';

/**
 * Hook to fetch current user's cart
 * Only enabled when user is authenticated
 */
export const useCart = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    return useQuery<ICartResponse, Error, ICart>({
        queryKey: cartQueryKeys.detail(),
        queryFn: cartService.getCart,
        enabled: isAuthenticated && !!token,
        staleTime: CART_CONFIG.STALE_TIME,
        select: (response) => response.data,
    });
};

/**
 * Hook to add item to cart
 * Includes validation and error tracking
 */
export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }) => {
            // Validate input before API call
            try {
                validateAddToCart({ variantId, quantity });
            } catch (error) {
                if (error instanceof z.ZodError) {
                    throw new Error(error.issues[0].message);
                }
                throw error;
            }
            return cartService.addToCart(variantId, quantity);
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
                            price: getVariantPrice(variant),
                            size: variant.size,
                            color: getColorName(variant.color),
                        });
                    }
                }
            }
            toast.success(TOAST_MESSAGES.ADD_SUCCESS);
            // Invalidate to refetch fresh data from server
            queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
        },
        onError: (error, variables) => {
            logger.error('Failed to add item to cart', {
                error,
                variantId: variables.variantId,
                quantity: variables.quantity,
            });
            toast.error(error instanceof Error ? error.message : TOAST_MESSAGES.ADD_ERROR);
        },
    });
};

/**
 * Hook to update cart item quantity with Optimistic Updates
 * Uses shared calculation logic for consistency
 */
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) => {
            // Validate input
            try {
                validateUpdateCartItem({ variantId, quantity });
            } catch (error) {
                if (error instanceof z.ZodError) {
                    throw new Error(error.issues[0].message);
                }
                throw error;
            }
            return cartService.updateCartItem(variantId, quantity);
        },

        onMutate: async ({ variantId, quantity }) => {
            await queryClient.cancelQueries({ queryKey: cartQueryKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartQueryKeys.detail());

            if (previousCart) {
                const currentItems = previousCart.items || [];
                const newItems = currentItems.map((item) => {
                    if (item.productVariant._id === variantId) {
                        return { ...item, quantity };
                    }
                    return item;
                });

                // Use shared calculation logic
                const { totalItems, totalPrice } = calculateCartTotals(newItems);

                queryClient.setQueryData<ICart>(cartQueryKeys.detail(), {
                    ...previousCart,
                    items: newItems,
                    totalItems,
                    totalPrice,
                });
            }

            return { previousCart };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
        },
        onError: (error, variables, context) => {
            logger.error('Failed to update cart item', {
                error,
                variantId: variables.variantId,
                quantity: variables.quantity,
            });
            toast.error(error instanceof Error ? error.message : TOAST_MESSAGES.UPDATE_ERROR);
            if (context?.previousCart) {
                queryClient.setQueryData(cartQueryKeys.detail(), context.previousCart);
            }
        },
    });
};

/**
 * Hook to remove item from cart with Optimistic Updates
 * Uses shared calculation logic for consistency
 */
export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variantId: string) => cartService.removeFromCart(variantId),

        onMutate: async (variantId) => {
            await queryClient.cancelQueries({ queryKey: cartQueryKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartQueryKeys.detail());

            if (previousCart) {
                const currentItems = previousCart.items || [];
                const newItems = currentItems.filter((item) => item.productVariant._id !== variantId);

                // Use shared calculation logic
                const { totalItems, totalPrice } = calculateCartTotals(newItems);

                queryClient.setQueryData<ICart>(cartQueryKeys.detail(), {
                    ...previousCart,
                    items: newItems,
                    totalItems,
                    totalPrice,
                });
            }

            return { previousCart };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
            toast.success(TOAST_MESSAGES.REMOVE_SUCCESS);
        },
        onError: (error, variantId, context) => {
            logger.error('Failed to remove item from cart', {
                error,
                variantId,
            });
            toast.error(TOAST_MESSAGES.REMOVE_ERROR);
            if (context?.previousCart) {
                queryClient.setQueryData(cartQueryKeys.detail(), context.previousCart);
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
            await queryClient.cancelQueries({ queryKey: cartQueryKeys.detail() });
            const previousCart = queryClient.getQueryData<ICart>(cartQueryKeys.detail());

            if (previousCart) {
                queryClient.setQueryData<ICart>(cartQueryKeys.detail(), {
                    ...previousCart,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                });
            }

            return { previousCart };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartQueryKeys.all });
        },
        onError: (error, _, context) => {
            logger.error('Failed to clear cart', { error });
            toast.error(TOAST_MESSAGES.CLEAR_ERROR);
            if (context?.previousCart) {
                queryClient.setQueryData(cartQueryKeys.detail(), context.previousCart);
            }
        },
    });
};
