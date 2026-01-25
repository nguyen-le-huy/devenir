import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/core/lib/queryClient'
import { fetchMyOrders, fetchMyOrderDetail } from '@/features/orders/api/orderService'

import { useAuthStore } from '@/core/stores/useAuthStore'

export const useMyOrders = (filters: any = {}) => {
    const isAuthenticated = useAuthStore((state: any) => state.isAuthenticated)
    const token = useAuthStore((state: any) => state.token)

    return useQuery({
        queryKey: queryKeys.orders.list(filters),
        queryFn: () => fetchMyOrders(filters),
        enabled: isAuthenticated && !!token,
        staleTime: 30 * 1000,
        refetchInterval: (data: any) => {
            const orders = data?.data || []
            const hasActive = orders.some((o: any) => o.status !== 'delivered' && o.status !== 'cancelled')
            return hasActive ? 10_000 : false
        },
        refetchIntervalInBackground: true,
    })
}

export const useMyOrderDetail = (orderId: string) => {
    return useQuery({
        queryKey: queryKeys.orders.detail(orderId),
        queryFn: () => fetchMyOrderDetail(orderId),
        enabled: Boolean(orderId),
        staleTime: 60 * 1000,
    })
}
