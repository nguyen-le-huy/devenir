import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as shippingService from '@/features/checkout/api/shippingService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { ShippingAddress } from '../types';

// Query keys for shipping
export const shippingKeys = {
    all: ['shipping'] as const,
    address: () => [...shippingKeys.all, 'address'] as const,
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
        mutationFn: (addressData: ShippingAddress) => shippingService.saveShippingAddress(addressData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shippingKeys.all });
        },
        onError: (error: any) => {
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
        mutationFn: (addressData: ShippingAddress) => shippingService.updateShippingAddress(addressData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shippingKeys.all });
        },
        onError: (error: any) => {
            console.error('Error updating shipping address:', error);
        },
    });
};
