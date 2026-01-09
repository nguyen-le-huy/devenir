import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient.js'
import { fetchMyOrders, fetchMyOrderDetail } from '../services/orderService.js'

import { useAuthStore } from '../stores/useAuthStore.js'

export const useMyOrders = (filters = {}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => fetchMyOrders(filters),
    enabled: isAuthenticated && !!token,
    staleTime: 30 * 1000,
    refetchInterval: (data) => {
      const orders = data?.data || []
      const hasActive = orders.some((o) => o.status !== 'delivered' && o.status !== 'cancelled')
      return hasActive ? 10_000 : false
    },
    refetchIntervalInBackground: true,
  })
}

export const useMyOrderDetail = (orderId) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchMyOrderDetail(orderId),
    enabled: Boolean(orderId),
    staleTime: 60 * 1000,
  })
}
