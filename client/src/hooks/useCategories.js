import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient.js';
import * as categoryService from '../services/categoryService.js';

/**
 * Hook to fetch all categories
 * @param {Object} params - Query parameters
 */
export const useCategories = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.list(params),
    queryFn: () => categoryService.getAllCategories(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
};

/**
 * Hook to fetch main categories (no parent)
 */
export const useMainCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.main(),
    queryFn: () => categoryService.getMainCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Hook to fetch single category by ID
 * @param {string} id - Category ID
 */
export const useCategoryById = (id) => {
  return useQuery({
    queryKey: queryKeys.categories.list({ id }),
    queryFn: () => categoryService.getCategoryById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};
