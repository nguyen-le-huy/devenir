import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import { fetchMyOrders, fetchMyOrderDetail } from '@/features/orders/api/orderService';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { IOrder, IOrderFilters } from '@/features/orders/types';

export const useMyOrders = (filters: IOrderFilters = {}): UseQueryResult<{ data: IOrder[], total: number, page: number, pages: number }, Error> => {
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

            // Check if there are any active orders
            const orders = (data as any)?.data || [];
            const hasActive = orders.some((o: IOrder) => o.status !== 'delivered' && o.status !== 'cancelled');
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
