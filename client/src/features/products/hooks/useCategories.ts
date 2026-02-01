import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import * as categoryService from '@/features/products/api/categoryService';
import type { ICategory, IApiResponse } from '@/features/products/types';

/**
 * Category Hooks
 * React Query hooks for category operations
 */

// Cache time constants
const STALE_TIMES = {
    CATEGORIES: 10 * 60 * 1000,     // 10 minutes - categories don't change often
    MAIN_CATEGORIES: 15 * 60 * 1000, // 15 minutes - main categories change rarely
} as const;

/**
 * Hook to fetch all categories
 */
export const useCategories = (params: Record<string, unknown> = {}) => {
    return useQuery<IApiResponse<ICategory[]>>({
        queryKey: queryKeys.categories.list(params),
        queryFn: () => categoryService.getAllCategories(params),
        staleTime: STALE_TIMES.CATEGORIES,
    });
};

/**
 * Hook to fetch main categories (no parent)
 */
export const useMainCategories = () => {
    return useQuery<IApiResponse<ICategory[]>>({
        queryKey: queryKeys.categories.main(),
        queryFn: () => categoryService.getMainCategories(),
        staleTime: STALE_TIMES.MAIN_CATEGORIES,
    });
};

/**
 * Hook to fetch single category by ID
 */
export const useCategoryById = (id: string) => {
    return useQuery<IApiResponse<ICategory>>({
        queryKey: queryKeys.categories.list({ id }),
        queryFn: () => categoryService.getCategoryById(id),
        enabled: !!id,
        staleTime: STALE_TIMES.CATEGORIES,
    });
};
