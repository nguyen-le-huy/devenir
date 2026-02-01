import { useQuery } from '@tanstack/react-query';
import { homeService } from '../api/homeService';
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
    queryKey: ['home', 'new-arrivals', limit],
    queryFn: () => homeService.getLatestProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - data doesn't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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
    queryKey: ['home', 'scarves-collection'],
    queryFn: () => homeService.getScarvesCollection(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
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
