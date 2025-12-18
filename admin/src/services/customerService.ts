import { api } from './api'

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type CustomerSegment = 'vip' | 'returning' | 'new' | 'inactive' | 'at-risk' | 'regular'
export type CustomerStatus = 'prospect' | 'active' | 'inactive' | 'vip' | 'at-risk'
export type PreferredChannel = 'email' | 'phone' | 'messaging' | 'in-person'

export interface CustomerAddress {
  fullName?: string
  phone?: string
  street?: string
  city?: string
  district?: string
  postalCode?: string
  isDefault?: boolean
}

export interface CustomerPreferences {
  channels?: {
    email?: boolean
    phone?: boolean
    messaging?: boolean
    post?: boolean
  }
  interests?: 'menswear' | 'womenswear' | 'both'
}

export interface CustomerProfile {
  loyaltyTier: LoyaltyTier
  status: CustomerStatus
  preferredChannel: PreferredChannel
  marketingOptIn: boolean
  tags: string[]
  notes?: string
  source?: string
  relationshipScore?: number
  accountManager?: string
}

export interface CustomerListItem {
  _id: string
  username?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  isEmailVerified?: boolean
  addresses?: CustomerAddress[]
  primaryAddress?: CustomerAddress | null
  customerProfile: CustomerProfile
  preferences?: CustomerPreferences
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: string | null
  lastOrderValue?: number
  loyaltyTier: LoyaltyTier
  customerSegment: CustomerSegment
  engagementScore: number
}

export interface CustomerListFilters {
  page?: number
  limit?: number
  search?: string
  segment?: CustomerSegment | 'all'
  tier?: LoyaltyTier | 'all'
  status?: CustomerStatus | 'all'
  channel?: PreferredChannel | 'all'
  tags?: string[]
  period?: 'all' | '30d' | '60d' | '90d' | 'ytd'
  sort?: 'recent' | 'value_desc' | 'orders_desc' | 'engagement_desc'
  marketingOptIn?: 'all' | 'yes' | 'no'
  rfmSegment?: string
  spendMin?: number
  spendMax?: number
  ordersMin?: number
  ordersMax?: number
  city?: string
  province?: string
}

export interface CustomerListResponse {
  success: boolean
  data: CustomerListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta: {
    segments: Record<string, number>
    statuses: Record<string, number>
    loyalty: Record<string, number>
    channels: Record<string, number>
    tags: Array<{ label: string; count: number }>
    totals: {
      totalSpent: number
      avgOrderValue: number
    }
  }
}

export interface CustomerOverviewResponse {
  success: boolean
  data: {
    totals: {
      totalCustomers: number
      newThisMonth: number
      vipCustomers: number
      activeCustomers: number
      growth: {
        totalCustomers: number | null
        newThisMonth: number | null
        vipCustomers: number | null
        activeCustomers: number | null
      }
    }
    revenue: {
      avgOrderValue: number
      lifetimeValue: number
      repeatPurchaseRate: number
    }
    retention: {
      returningCustomers: number
      atRiskCustomers: number
      churnRisk: number
    }
    distribution: {
      segments: Array<{ label: string; count: number }>
      loyalty: Array<{ label: string; count: number }>
      channels: Array<{ label: string; count: number }>
    }
    trend: Array<{ label: string; revenue: number; orders: number }>
    insights: string[]
  }
}

export interface CustomerOrderSummary {
  _id: string
  totalPrice: number
  status: string
  paymentMethod: string
  createdAt: string
  orderItems: Array<{
    name: string
    sku?: string
    quantity: number
    price: number
  }>
  shippingAddress?: CustomerAddress
}

export interface CustomerDetailResponse {
  success: boolean
  data: CustomerListItem & {
    stats: {
      totals: {
        totalOrders: number
        totalSpent: number
        avgOrderValue: number
        lastOrderDate: string | null
      }
      paymentMethods: Array<{ label: string; count: number }>
      statusBreakdown: Array<{ label: string; count: number }>
      topProducts: Array<{ name: string; revenue: number; quantity: number }>
    }
    recentOrders: CustomerOrderSummary[]
    insights: string[]
  }
}

export interface CustomerFormPayload {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  password?: string
  customerProfile?: Partial<CustomerProfile>
  preferences?: CustomerPreferences
  addresses?: CustomerAddress[]
}

const normalizeFilters = (filters: CustomerListFilters = {}) => {
  const params: Record<string, unknown> = {}
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit
  if (filters.search) params.search = filters.search
  if (filters.segment && filters.segment !== 'all') params.segment = filters.segment
  if (filters.tier && filters.tier !== 'all') params.tier = filters.tier
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.channel && filters.channel !== 'all') params.channel = filters.channel
  if (filters.sort) params.sort = filters.sort
  if (filters.period) params.period = filters.period
  if (filters.tags && filters.tags.length) params.tags = filters.tags.join(',')
  return params
}

export const customerService = {
  getCustomers: async (filters?: CustomerListFilters): Promise<CustomerListResponse> => {
    const response = await api.get('/customers', { params: normalizeFilters(filters) })
    return response.data
  },
  getOverview: async (): Promise<CustomerOverviewResponse> => {
    const response = await api.get('/customers/overview')
    return response.data
  },
  getCustomerById: async (id: string): Promise<CustomerDetailResponse> => {
    const response = await api.get(`/customers/${id}`)
    return response.data
  },
  getCustomerOrders: async (id: string, limit = 10) => {
    const response = await api.get(`/customers/${id}/orders`, { params: { limit } })
    return response.data
  },
  createCustomer: async (payload: CustomerFormPayload) => {
    const response = await api.post('/customers', payload)
    return response.data
  },
  updateCustomer: async (id: string, payload: CustomerFormPayload) => {
    const response = await api.put(`/customers/${id}`, payload)
    return response.data
  },
  deleteCustomer: async (id: string) => {
    const response = await api.delete(`/customers/${id}`)
    return response.data
  },
}
