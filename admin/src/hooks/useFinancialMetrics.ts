import { useQuery } from '@tanstack/react-query'
import { financialService, type DashboardMetricsResponse, type RevenueStatsResponse } from '@/services/financialService'
import { QUERY_KEYS } from '@/lib/queryClient'

export const useDashboardMetrics = () => {
  return useQuery<DashboardMetricsResponse>({
    queryKey: QUERY_KEYS.financial.dashboard(),
    queryFn: () => financialService.getDashboardMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRevenueStats = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery<RevenueStatsResponse>({
    queryKey: QUERY_KEYS.financial.stats(params),
    queryFn: () => financialService.getRevenueStats(params),
    staleTime: 5 * 60 * 1000,
  })
}
