import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryClient.js'
import { fetchMyOrders, fetchMyOrderDetail } from '../services/orderService.js'

export const useMyOrders = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => fetchMyOrders(filters),
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
