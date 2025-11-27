import { QueryClient } from '@tanstack/react-query'

/**
 * Global React Query Client Configuration for Admin Panel
 * 
 * Strategy:
 * - Persistent cache: Data survives navigation between pages
 * - Smart refetch: Background updates without blocking UI
 * - Optimistic updates: Instant UI feedback on mutations
 * - Scalable: Works efficiently even with large datasets
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 10 minutes - perfect for admin data that doesn't change frequently
      staleTime: 10 * 60 * 1000, // 10 minutes
      
      // Keep data in cache for 30 minutes even if unused
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      
      // Don't refetch on window focus (admin users often switch tabs)
      refetchOnWindowFocus: false,
      
      // Retry failed requests only once
      retry: 1,
      
      // Keep previous data while fetching new data (prevents flickering)
      placeholderData: (previousData: any) => previousData,
      
      // Enable persistent cache across navigation
      refetchOnMount: false, // Only fetch if data is stale
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
  },
  colors: {
    all: ['colors'] as const,
    lists: () => [...QUERY_KEYS.colors.all, 'list'] as const,
    list: () => [...QUERY_KEYS.colors.lists()] as const,
  },
  brands: {
    all: ['brands'] as const,
    lists: () => [...QUERY_KEYS.brands.all, 'list'] as const,
    list: () => [...QUERY_KEYS.brands.lists()] as const,
  },
} as const
