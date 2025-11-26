import { QueryClient } from '@tanstack/react-query';

/**
 * React Query configuration for optimal performance
 * Docs: https://tanstack.com/query/latest/docs/react/guides/important-defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: Data stays in cache for 10 minutes after becoming unused
      cacheTime: 10 * 60 * 1000, // 10 minutes
      
      // Retry failed requests 1 time only
      retry: 1,
      
      // Don't refetch on window focus by default (better UX)
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      
      // Use cached data while refetching in background
      keepPreviousData: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

/**
 * Query keys factory for consistent cache keys
 */
export const queryKeys = {
  // Products
  products: {
    all: ['products'],
    lists: () => [...queryKeys.products.all, 'list'],
    list: (filters) => [...queryKeys.products.lists(), filters],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (id) => [...queryKeys.products.details(), id],
    variants: (id) => [...queryKeys.products.detail(id), 'variants'],
  },
  
  // Categories
  categories: {
    all: ['categories'],
    lists: () => [...queryKeys.categories.all, 'list'],
    list: (filters) => [...queryKeys.categories.lists(), filters],
    main: () => [...queryKeys.categories.all, 'main'],
  },
  
  // Colors
  colors: {
    all: ['colors'],
    list: () => [...queryKeys.colors.all, 'list'],
  },
  
  // Variants by category
  variantsByCategory: (categoryId) => ['variants', 'category', categoryId],
};
