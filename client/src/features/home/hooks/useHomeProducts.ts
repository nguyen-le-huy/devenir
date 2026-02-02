import { useQuery } from '@tanstack/react-query';
import { homeService } from '../api/homeService';
import { queryKeys } from '@/core/lib/queryClient';
import { CACHE_TIMES } from '@/features/products/types';
import type { NewArrivalProduct, ScarvesProduct } from '../types';

/**
 * Custom hook for fetching New Arrivals products
 * Wraps React Query with home-specific configuration
 * 
 * @param limit - Number of products to fetch (default: 4)
 * @returns Products data, loading state, and error state
 */
export const useNewArrivals = (limit: number = 4) => {
  const { data, isLoading, isError, error } = useQuery<NewArrivalProduct[]>({
    queryKey: queryKeys.home.newArrivals(limit),
    queryFn: () => homeService.getLatestProducts(limit),
    staleTime: CACHE_TIMES.PRODUCT_STALE,
    gcTime: CACHE_TIMES.STATIC_STALE,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    products: data || [],
    isLoading,
    isError,
    error,
  };
};

/**
 * Custom hook for fetching Scarves Collection
 * Consolidates category finding and variant fetching logic
 * 
 * @returns Scarves products data, loading state, and error state
 */
export const useScarves = () => {
  const { data, isLoading, isError, error } = useQuery<ScarvesProduct[]>({
    queryKey: queryKeys.home.scarvesCollection(),
    queryFn: () => homeService.getScarvesCollection(),
    staleTime: CACHE_TIMES.CATEGORY_STALE,
    gcTime: CACHE_TIMES.STATIC_STALE,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    products: data || [],
    isLoading,
    isError,
    error,
  };
};
