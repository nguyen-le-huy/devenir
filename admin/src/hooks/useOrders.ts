import { useMemo } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    orderService,
    type Order,
    type OrderListFilters,
    type OrderListResponse,
    type OrderStatus,
    type OrderStatsResponse,
} from '@/services/orderService'

// Extend QUERY_KEYS (will need to add to queryClient.ts)
export const ORDER_KEYS = {
    all: ['orders'] as const,
    lists: () => [...ORDER_KEYS.all, 'list'] as const,
    list: (filters?: OrderListFilters) => [...ORDER_KEYS.lists(), filters] as const,
    details: () => [...ORDER_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...ORDER_KEYS.details(), id] as const,
    stats: (period?: string) => [...ORDER_KEYS.all, 'stats', period] as const,
}

const useNormalizedFilters = (filters: OrderListFilters) => {
    return useMemo(() => ({
        ...filters,
    }), [filters])
}

export const useOrderList = (filters: OrderListFilters) => {
    const normalizedFilters = useNormalizedFilters(filters)
    return useQuery<OrderListResponse>({
        queryKey: ORDER_KEYS.list(normalizedFilters),
        queryFn: () => orderService.getOrders(filters),
        placeholderData: keepPreviousData,
    })
}

export const useOrderDetail = (id?: string) => {
    return useQuery({
        queryKey: id ? ORDER_KEYS.detail(id) : ORDER_KEYS.details(),
        queryFn: () => orderService.getOrderById(id!),
        enabled: Boolean(id),
    })
}

export const useOrderStats = (period = '30d') => {
    return useQuery<OrderStatsResponse>({
        queryKey: ORDER_KEYS.stats(period),
        queryFn: () => orderService.getStats(period),
        staleTime: 60_000, // 1 minute
    })
}

export const useOrderMutations = () => {
    const queryClient = useQueryClient()

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            orderService.updateOrderStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all })
            if (variables.id) {
                queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) })
            }
        },
    })

    const deleteOrder = useMutation({
        mutationFn: (id: string) => orderService.deleteOrder(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all })
            if (id) {
                queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(id) })
            }
        },
    })

    return {
        updateStatus,
        deleteOrder,
    }
}

// Export types for convenience
export type { Order, OrderListFilters, OrderStatus }
