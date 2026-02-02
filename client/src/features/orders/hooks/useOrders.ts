import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import { fetchMyOrders, fetchMyOrderDetail } from '@/features/orders/api/orderService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { IOrder, IOrderFilters, IOrderListResponse } from '@/features/orders/types';

export const useMyOrders = (filters: IOrderFilters = {}): UseQueryResult<IOrderListResponse, Error> => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    return useQuery({
        queryKey: queryKeys.orders.list(filters),
        queryFn: () => fetchMyOrders(filters),
        enabled: isAuthenticated && !!token,
        staleTime: 30 * 1000,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return false;

            // Check if there are any active orders to poll for updates
            const orders = data.data || [];
            const hasActive = orders.some((o) => o.status !== 'delivered' && o.status !== 'cancelled');
            return hasActive ? 10_000 : false;
        },
        refetchIntervalInBackground: true,
    });
};

export const useMyOrderDetail = (orderId: string): UseQueryResult<IOrder, Error> => {
    return useQuery({
        queryKey: queryKeys.orders.detail(orderId),
        queryFn: () => fetchMyOrderDetail(orderId),
        enabled: Boolean(orderId),
        staleTime: 60 * 1000,
    });
};
