import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '../services/cartService.js';
import { trackEvent } from '../utils/eventTracker.js';
import { trackingService } from '../services/trackingService';

import { useAuthStore } from '../stores/useAuthStore';

// Query keys for cart
export const cartKeys = {
    all: ['cart'],
    detail: () => [...cartKeys.all, 'detail'],
};

/**
 * Hook to fetch current user's cart
 * Only enabled when user is authenticated
 */
export const useCart = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    return useQuery({
        queryKey: cartKeys.detail(),
        queryFn: cartService.getCart,
        enabled: isAuthenticated && !!token,
        staleTime: 30 * 1000,
    });
};

/**
 * Hook to add item to cart
 * Returns mutation function with optimistic updates
 */
export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity = 1 }) =>
            cartService.addToCart(variantId, quantity),
        onSuccess: (data, variables) => {
            // Track add to cart event
            if (data?.cart) {
                const addedItem = data.cart.items?.find(item => item.variant?._id === variables.variantId);
                if (addedItem) {
                    // Legacy tracking
                    trackEvent.addToCart({
                        productId: addedItem.variant?.product?._id || addedItem.product?._id,
                        productName: addedItem.variant?.product?.name || addedItem.product?.name || 'Unknown',
                        variantId: addedItem.variant?._id,
                        category: addedItem.variant?.product?.category?.name || addedItem.product?.category?.name,
                        brand: addedItem.variant?.product?.brand?.name || addedItem.product?.brand?.name,
                        color: addedItem.variant?.color?.name,
                        size: addedItem.variant?.size || 'Free Size',
                        price: addedItem.variant?.salePrice || addedItem.variant?.basePrice,
                        quantity: variables.quantity
                    });

                    // New tracking service
                    trackingService.trackCartAction('add', {
                        productId: addedItem.variant?.product?._id || addedItem.product?._id,
                        productName: addedItem.variant?.product?.name || addedItem.product?.name || 'Unknown',
                        quantity: variables.quantity,
                        price: addedItem.variant?.salePrice || addedItem.variant?.basePrice || 0,
                        size: addedItem.variant?.size,
                        color: addedItem.variant?.color?.name
                    });
                }
            }

            // Invalidate and refetch cart
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error) => {
            console.error('Error adding to cart:', error);
        },
    });
};

/**
 * Hook to update cart item quantity
 */
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, quantity }) =>
            cartService.updateCartItem(variantId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error) => {
            console.error('Error updating cart item:', error);
        },
    });
};

/**
 * Hook to remove item from cart
 */
export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variantId) => cartService.removeFromCart(variantId),
        onSuccess: (data, variantId) => {
            // Track remove from cart event
            trackEvent.removeFromCart({
                variantId,
                timestamp: new Date().toISOString()
            });

            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error) => {
            console.error('Error removing from cart:', error);
        },
    });
};

/**
 * Hook to clear entire cart
 */
export const useClearCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cartService.clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cartKeys.all });
        },
        onError: (error) => {
            console.error('Error clearing cart:', error);
        },
    });
};
