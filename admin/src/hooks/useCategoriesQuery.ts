import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/services/axiosConfig'
import { QUERY_KEYS } from '@/lib/queryClient'

/**
 * Hook to fetch categories with persistent caching
 * 
 * This hook ensures categories are cached for 15 minutes and survives navigation
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.categories.list(),
    queryFn: async () => {
      const response = await axiosInstance.get('/categories?limit=100&isActive=true')
      return response.data?.data || response.data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - categories rarely change
    gcTime: 30 * 60 * 1000, // Keep for 30 minutes
  })
}
