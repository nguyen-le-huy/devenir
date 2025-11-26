import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient.js';
import * as productService from '../services/productService.js';

/**
 * Hook to fetch products with pagination and filtering
 * @param {Object} params - Query parameters (page, limit, category, brand, status, search)
 */
export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.getAllProducts(params),
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

/**
 * Hook to fetch single product by ID
 * @param {string} id - Product ID
 */
export const useProduct = (id) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id, // Only fetch if id exists
  });
};

/**
 * Hook to fetch product variants
 * @param {string} productId - Product ID
 */
export const useProductVariants = (productId) => {
  return useQuery({
    queryKey: queryKeys.products.variants(productId),
    queryFn: () => productService.getProductVariants(productId),
    enabled: !!productId,
  });
};

/**
 * Hook to fetch variants by category
 * @param {string} categoryId - Category ID
 */
export const useVariantsByCategory = (categoryId) => {
  return useQuery({
    queryKey: queryKeys.variantsByCategory(categoryId),
    queryFn: () => productService.getVariantsByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 3 * 60 * 1000, // 3 minutes - category data changes less frequently
  });
};

/**
 * Hook to fetch variant by ID with detailed info
 * @param {string} variantId - Variant ID
 */
export const useVariantById = (variantId) => {
  return useQuery({
    queryKey: ['variant', variantId],
    queryFn: () => productService.getVariantById(variantId),
    enabled: !!variantId,
  });
};
