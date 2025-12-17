import { api } from './api'

export interface AggregatedWindow {
  revenue: number
  costs: number
  netProfit: number
  orders: number
}

export interface RevenueByDayEntry extends AggregatedWindow {
  _id: {
    y: number
    m: number
    d: number
  }
}

export interface DashboardMetricsResponse {
  success: boolean
  data: {
    today: AggregatedWindow
    thisMonth: AggregatedWindow
    thisYear: AggregatedWindow
    revenueByDay: RevenueByDayEntry[]
  }
  cached?: boolean
}

export interface RevenueStatsResponse {
  success: boolean
  data: {
    revenue: number
    costs: number
    shipping: number
    platformFee: number
    netProfit: number
    orders: number
  }
}

export const financialService = {
  getDashboardMetrics: async (): Promise<DashboardMetricsResponse> => {
    const response = await api.get('/financial/dashboard-metrics')
    return response.data
  },
  getRevenueStats: async (params?: { startDate?: string; endDate?: string }): Promise<RevenueStatsResponse> => {
    const response = await api.get('/financial/stats', { params })
    return response.data
  },
}
