import { useMemo } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import {
  customerService,
  type CustomerDetailResponse,
  type CustomerFormPayload,
  type CustomerListFilters,
  type CustomerListResponse,
  type CustomerOverviewResponse,
} from '@/services/customerService'

const useNormalizedFilters = (filters: CustomerListFilters) => {
  return useMemo(() => ({
    ...filters,
    tags: filters.tags && filters.tags.length ? [...filters.tags].sort() : undefined,
  }), [filters])
}

export const useCustomerOverview = () => {
  return useQuery<CustomerOverviewResponse>({
    queryKey: QUERY_KEYS.customers.overview(),
    queryFn: customerService.getOverview,
    staleTime: 60_000,
  })
}

export const useCustomerList = (filters: CustomerListFilters) => {
  const normalizedFilters = useNormalizedFilters(filters)
  return useQuery<CustomerListResponse>({
    queryKey: QUERY_KEYS.customers.list(normalizedFilters),
    queryFn: () => customerService.getCustomers(filters),
    placeholderData: keepPreviousData,
  })
}

export const useCustomerDetail = (id?: string) => {
  return useQuery<CustomerDetailResponse>({
    queryKey: id ? QUERY_KEYS.customers.detail(id) : QUERY_KEYS.customers.details(),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: Boolean(id),
  })
}

export const useCustomerOrders = (id?: string, limit = 10) => {
  return useQuery({
    queryKey: id ? QUERY_KEYS.customers.orders(id, { limit }) : QUERY_KEYS.customers.orders('unknown'),
    queryFn: () => customerService.getCustomerOrders(id!, limit),
    enabled: Boolean(id),
  })
}

export const useCustomerMutations = () => {
  const queryClient = useQueryClient()

  const createCustomer = useMutation({
    mutationFn: (payload: CustomerFormPayload) => customerService.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
    },
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerFormPayload }) => customerService.updateCustomer(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.detail(variables.id) })
      }
    },
  })

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all })
      if (id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.detail(id) })
      }
    },
  })

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
