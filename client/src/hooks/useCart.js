import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '../services/cartService.js';

// Query keys for cart
export const cartKeys = {
    all: ['cart'],
    detail: () => [...cartKeys.all, 'detail'],
};

/**
 * Hook to fetch current user's cart
 * Only enabled when user is authenticated (check token in localStorage)
 */
export const useCart = () => {
    const token = localStorage.getItem('token');
    
    return useQuery({
        queryKey: cartKeys.detail(),
        queryFn: cartService.getCart,
        enabled: !!token, // Only fetch if user is logged in
        staleTime: 30 * 1000, // 30 seconds - cart changes frequently
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
        onSuccess: (data) => {
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
