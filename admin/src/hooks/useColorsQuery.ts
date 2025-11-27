import { useQuery } from '@tanstack/react-query'
import axiosInstance from '@/services/axiosConfig'
import { QUERY_KEYS } from '@/lib/queryClient'

/**
 * Hook to fetch colors with persistent caching
 */
export function useColorsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.colors.list(),
    queryFn: async () => {
      const response = await axiosInstance.get('/colors?limit=100&isActive=true')
      return response.data?.data || response.data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
  })
}
