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

            // Garbage collection time: Data stays in cache for 10 minutes after becoming unused
            gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)

            // Retry failed requests 1 time only
            retry: 1,

            // Don't refetch on window focus by default (better UX)
            refetchOnWindowFocus: false,

            // Don't refetch on reconnect
            refetchOnReconnect: false,

            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
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
        all: ['products'] as const,
        lists: () => [...queryKeys.products.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
        details: () => [...queryKeys.products.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.products.details(), id] as const,
        variants: (id: string) => [...queryKeys.products.detail(id), 'variants'] as const,
    },

    // Categories
    categories: {
        all: ['categories'] as const,
        lists: () => [...queryKeys.categories.all, 'list'] as const,
        list: (filters: Record<string, any>) => [...queryKeys.categories.lists(), filters] as const,
        main: () => [...queryKeys.categories.all, 'main'] as const,
    },


    // Colors
    colors: {
        all: ['colors'] as const,
        list: () => [...queryKeys.colors.all, 'list'] as const,
    },

    // Variants by category
    variantsByCategory: (categoryId: string) => ['variants', 'category', categoryId] as const,

    // Variants
    variants: {
        all: ['variants'] as const,
        lists: () => [...queryKeys.variants.all, 'list'] as const,
        list: (params: Record<string, unknown>) => [...queryKeys.variants.lists(), params] as const,
        detail: (id: string) => [...queryKeys.variants.all, 'detail', id] as const,
        latest: (limit: number) => [...queryKeys.variants.all, 'latest', limit] as const,
        random: (limit: number) => [...queryKeys.variants.all, 'random', limit] as const,
        categoryWithChildren: (categoryId: string) => [...queryKeys.variants.all, 'categoryWithChildren', categoryId] as const,
    },

    // Orders
    orders: {
        all: ['orders'] as const,
        list: (filters: Record<string, any>) => [...['orders'], 'list', filters] as const,
        detail: (id: string) => [...['orders'], 'detail', id] as const,
    },
};
