import { QueryClient } from '@tanstack/react-query'

/**
 * Global React Query Client Configuration for Admin Panel
 * 
 * Strategy:
 * - Realtime updates: 30sec staleTime for immediate feedback on CRUD operations
 * - Smart refetch: Background updates with refetchType: 'active'
 * - Simple & reliable: No optimistic updates, just invalidate + refetch
 * - Scalable: Works efficiently even with large datasets
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 30 seconds - realtime updates for admin panel
      staleTime: 30 * 1000, // 30 seconds (overridden per-query if needed)
      
      // Keep data in cache for 5 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      
      // Don't refetch on window focus (admin users often switch tabs)
      refetchOnWindowFocus: false,
      
      // Retry failed requests only once
      retry: 1,
      
      // Keep previous data while fetching new data (prevents flickering)
      placeholderData: (previousData: any) => previousData,
      
      // Refetch on mount to ensure fresh data
      refetchOnMount: true,
      refetchOnReconnect: true, // Fetch fresh data when internet reconnects
    },
    mutations: {
      // Retry mutations once on network error
      retry: 1,
      
      // Global error handler for mutations
      onError: (error: any) => {
        console.error('Mutation error:', error)
      },
    },
  },
})

/**
 * Query Keys for consistent cache management
 * 
 * Usage:
 * - useQuery({ queryKey: QUERY_KEYS.products.list() })
 * - queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all })
 */
export const QUERY_KEYS = {
  products: {
    all: ['products'] as const,
    lists: () => [...QUERY_KEYS.products.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.products.lists(), filters] as const,
    details: () => [...QUERY_KEYS.products.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.products.details(), id] as const,
  },
  variants: {
    all: ['variants'] as const,
    lists: () => [...QUERY_KEYS.variants.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.variants.lists(), filters] as const,
    details: () => [...QUERY_KEYS.variants.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.variants.details(), id] as const,
    byProduct: (productId: string) => [...QUERY_KEYS.variants.all, 'product', productId] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => [...QUERY_KEYS.categories.all, 'list'] as const,
    list: () => [...QUERY_KEYS.categories.lists()] as const,
    tree: () => [...QUERY_KEYS.categories.all, 'tree'] as const,
  },
  colors: {
    all: ['colors'] as const,
    lists: () => [...QUERY_KEYS.colors.all, 'list'] as const,
    list: () => [...QUERY_KEYS.colors.lists()] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    overview: () => [...QUERY_KEYS.inventory.all, 'overview'] as const,
    list: (filters?: any) => [...QUERY_KEYS.inventory.all, 'list', filters] as const,
    alerts: () => [...QUERY_KEYS.inventory.all, 'alerts'] as const,
    adjustments: (filters?: any) => [...QUERY_KEYS.inventory.all, 'adjustments', filters] as const,
    variant: (id: string) => [...QUERY_KEYS.inventory.all, 'variant', id] as const,
  },
  brands: {
    all: ['brands'] as const,
    lists: () => [...QUERY_KEYS.brands.all, 'list'] as const,
    list: () => [...QUERY_KEYS.brands.lists()] as const,
  },
  customers: {
    all: ['customers'] as const,
    lists: () => [...QUERY_KEYS.customers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...QUERY_KEYS.customers.lists(), filters] as const,
    overview: () => [...QUERY_KEYS.customers.all, 'overview'] as const,
    details: () => [...QUERY_KEYS.customers.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.customers.details(), id] as const,
    orders: (id: string, params?: Record<string, unknown>) => [...QUERY_KEYS.customers.all, 'orders', id, params] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...QUERY_KEYS.orders.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.orders.lists(), filters] as const,
    details: () => [...QUERY_KEYS.orders.all, 'detail'] as const,
    detail: (id: string) => [...QUERY_KEYS.orders.details(), id] as const,
    stats: (period?: string) => [...QUERY_KEYS.orders.all, 'stats', period] as const,
  },
  shipments: {
    all: ['shipments'] as const,
    lists: () => [...QUERY_KEYS.shipments.all, 'list'] as const,
    list: (filters?: any) => [...QUERY_KEYS.shipments.lists(), filters] as const,
  },
  financial: {
    all: ['financial'] as const,
    dashboard: () => [...QUERY_KEYS.financial.all, 'dashboard'] as const,
    stats: (params?: any) => [...QUERY_KEYS.financial.all, 'stats', params] as const,
  },
} as const
