import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '@/features/cart/api/cartService';
import { trackingService } from '@/features/orders/api/trackingService';

import { useAuthStore } from '@/core/stores/useAuthStore';

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
        mutationFn: ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }) =>
            cartService.addToCart(variantId, quantity),
        onSuccess: (data: any, variables) => {
            // Track add to cart event
            if (data?.cart) {
                const addedItem = data.cart.items?.find((item: any) => item.variant?._id === variables.variantId);
                if (addedItem) {

                    trackingService.trackCartAction('add', {
                        productId: addedItem.variant?.product?._id || addedItem.product?._id,
                        productName: addedItem.variant?.product?.name || addedItem.product?.name || 'Unknown',
                        quantity: variables.quantity || 1,
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
        mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
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
        mutationFn: (variantId: string) => cartService.removeFromCart(variantId),
        onSuccess: () => {
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
