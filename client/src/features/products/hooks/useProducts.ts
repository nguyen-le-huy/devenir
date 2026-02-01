import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/core/lib/queryClient';
import * as productService from '@/features/products/api/productService';
import type {
    IProductListParams,
    IEnrichedVariant,
    IVariant,
    IApiResponse,
    IVariantDetailResponse,
} from '@/features/products/types';

/**
 * Product Hooks - React Query hooks for product operations
 * All hooks use proper TypeScript types and query key factory
 */

// Cache time constants
const STALE_TIMES = {
    CATEGORY: 3 * 60 * 1000,     // 3 minutes - category data changes less frequently
    PRODUCT: 5 * 60 * 1000,      // 5 minutes - standard product data
    SUGGESTIONS: 5 * 60 * 1000,  // 5 minutes - suggestions can stay cached longer
} as const;

/**
 * Hook to fetch products with pagination and filtering
 */
export const useProducts = (params: IProductListParams = {}) => {
    return useQuery({
        queryKey: queryKeys.products.list(params),
        queryFn: () => productService.getAllProducts(params),
        placeholderData: keepPreviousData,
    });
};

/**
 * Hook to fetch single product by ID
 */
export const useProduct = (id: string) => {
    return useQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => productService.getProductById(id),
        enabled: !!id,
    });
};

/**
 * Hook to fetch product variants
 */
export const useProductVariants = (productId: string) => {
    return useQuery({
        queryKey: queryKeys.products.variants(productId),
        queryFn: () => productService.getProductVariants(productId),
        enabled: !!productId,
    });
};

/**
 * Hook to fetch variants by category
 */
export const useVariantsByCategory = (categoryId: string) => {
    return useQuery<IEnrichedVariant[]>({
        queryKey: queryKeys.variantsByCategory(categoryId),
        queryFn: () => productService.getVariantsByCategory(categoryId),
        enabled: !!categoryId,
        staleTime: STALE_TIMES.CATEGORY,
    });
};

/**
 * Hook to fetch variant by ID with detailed info
 */
export const useVariantById = (variantId: string) => {
    return useQuery<IVariantDetailResponse>({
        queryKey: queryKeys.variants.detail(variantId),
        queryFn: () => productService.getVariantById(variantId),
        enabled: !!variantId,
    });
};

/**
 * Hook to fetch latest variants (for homepage/new arrivals)
 */
export const useLatestVariants = (limit = 4) => {
    return useQuery<IEnrichedVariant[]>({
        queryKey: queryKeys.variants.latest(limit),
        queryFn: () => productService.getLatestVariants(limit),
        staleTime: STALE_TIMES.SUGGESTIONS,
    });
};

/**
 * Hook to fetch all variants with optional filtering
 */
export const useAllVariants = (params: Record<string, unknown> = {}) => {
    return useQuery<IApiResponse<IVariant[]>>({
        queryKey: queryKeys.variants.list(params),
        queryFn: () => productService.getAllVariants(params),
        staleTime: STALE_TIMES.CATEGORY,
    });
};

/**
 * Hook to fetch random variants (for product suggestions)
 */
export const useRandomVariants = (limit = 8) => {
    return useQuery<IEnrichedVariant[]>({
        queryKey: queryKeys.variants.random(limit),
        queryFn: () => productService.getRandomVariants(limit),
        staleTime: STALE_TIMES.SUGGESTIONS,
    });
};
