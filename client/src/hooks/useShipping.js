import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as shippingService from '../services/shippingService.js';

import { useAuthStore } from '../stores/useAuthStore';

// Query keys for shipping
export const shippingKeys = {
    all: ['shipping'],
    address: () => [...shippingKeys.all, 'address'],
};

/**
 * Hook to fetch user's shipping address
 */
export const useShippingAddress = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    return useQuery({
        queryKey: shippingKeys.address(),
        queryFn: shippingService.getShippingAddress,
        enabled: isAuthenticated && !!token,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to save shipping address
 */
export const useSaveShippingAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (addressData) => shippingService.saveShippingAddress(addressData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: shippingKeys.all });
        },
        onError: (error) => {
            console.error('Error saving shipping address:', error);
        },
    });
};

/**
 * Hook to update shipping address
 */
export const useUpdateShippingAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (addressData) => shippingService.updateShippingAddress(addressData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: shippingKeys.all });
        },
        onError: (error) => {
            console.error('Error updating shipping address:', error);
        },
    });
};
