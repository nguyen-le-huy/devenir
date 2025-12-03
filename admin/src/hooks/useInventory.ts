import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axiosInstance from '@/services/axiosConfig'
import { QUERY_KEYS } from '@/lib/queryClient'

export type InventoryHealth = 'healthy' | 'low-stock' | 'out-of-stock' | 'overstock'

export interface InventoryAdjustment {
  _id: string
  variant: string
  product?: string
  sku: string
  delta: number
  quantityBefore: number
  quantityAfter: number
  reason: string
  note?: string
  costPerUnit?: number
  costImpact?: number
  performedBy?: string
  performedByName?: string
  sourceType?: string
  sourceRef?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface InventoryOverviewResponse {
  totalSkus: number
  totalUnits: number
  reservedUnits: number
  incomingUnits: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  turnoverRate: number
  daysOfSupply: number | null
  recentAdjustments: InventoryAdjustment[]
}

export interface InventoryListItem {
  _id: string
  sku: string
  color?: string
  size?: string
  price: number
  quantity: number
  reserved?: number
  incoming?: number
  available?: number
  inventoryValue?: number
  lowStockThreshold?: number
  binLocation?: string
  reorderPoint?: number
  healthStatus: InventoryHealth
  updatedAt: string
  product: {
    _id: string
    name: string
    category?: string
    brand?: string
  }
}

export interface InventoryListResponse {
  data: InventoryListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    totalUnits: number
    totalValue: number
    lowStock: number
    outOfStock: number
  }
}

export interface InventoryAlertsResponse {
  lowStock: InventoryListItem[]
  outOfStock: InventoryListItem[]
  overstock: InventoryListItem[]
  reservationIssues: InventoryListItem[]
}

export interface InventoryListFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  brand?: string
  stockStatus?: InventoryHealth | 'all'
  productStatus?: string | 'all'
}

export interface AdjustmentPayload {
  variantId: string
  operation: 'set' | 'add' | 'subtract'
  quantity: number
  reason?: string
  note?: string
  costPerUnit?: number
  sourceType?: string
  sourceRef?: string
  metadata?: Record<string, unknown>
}

const buildQueryString = (filters: InventoryListFilters = {}) => {
  const params = new URLSearchParams()

  if (filters.page) params.set('page', filters.page.toString())
  if (filters.limit) params.set('limit', filters.limit.toString())
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.brand) params.set('brand', filters.brand)
  if (filters.productStatus && filters.productStatus !== 'all') params.set('productStatus', filters.productStatus)
  if (filters.stockStatus && filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus)

  return params.toString()
}

export function useInventoryOverview() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.overview(),
    queryFn: async (): Promise<InventoryOverviewResponse> => {
      const response = await axiosInstance.get('/admin/inventory/overview')
      return response.data?.data || response.data
    },
    staleTime: 15 * 1000,
  })
}

export function useInventoryList(filters: InventoryListFilters) {
  const filterKey = JSON.stringify(filters || {})
  const serializedFilters = useMemo<InventoryListFilters>(() => JSON.parse(filterKey), [filterKey])

  return useQuery({
    queryKey: QUERY_KEYS.inventory.list(serializedFilters),
    queryFn: async (): Promise<InventoryListResponse> => {
      const queryString = buildQueryString(serializedFilters)
      const response = await axiosInstance.get(`/admin/inventory${queryString ? `?${queryString}` : ''}`)
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
        summary: response.data?.summary || { totalUnits: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 15 * 1000,
  })
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.alerts(),
    queryFn: async (): Promise<InventoryAlertsResponse> => {
      const response = await axiosInstance.get('/admin/inventory/alerts')
      return response.data?.data || response.data
    },
    staleTime: 60 * 1000,
  })
}

export function useInventoryAdjustments(filters: { page?: number; limit?: number; reason?: string; variantId?: string } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.adjustments(filters),
    queryFn: async (): Promise<{ data: InventoryAdjustment[]; pagination: InventoryListResponse['pagination'] }> => {
      const params = new URLSearchParams()
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.reason) params.set('reason', filters.reason)
      if (filters.variantId) params.set('variantId', filters.variantId)

      const response = await axiosInstance.get(`/admin/inventory/adjustments${params.size ? `?${params.toString()}` : ''}`)
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      }
    },
    enabled: !!filters,
  })
}

export function useInventoryVariantDetail(variantId?: string | null) {
  return useQuery({
    queryKey: variantId ? QUERY_KEYS.inventory.variant(variantId) : ['inventory', 'variant', 'noop'],
    queryFn: async () => {
      const response = await axiosInstance.get(`/admin/inventory/variant/${variantId}`)
      return response.data?.data || response.data
    },
    enabled: !!variantId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useInventoryAdjustmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdjustmentPayload) => {
      const response = await axiosInstance.post('/admin/inventory/adjustments', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all, refetchType: 'active' })
    },
  })
}
