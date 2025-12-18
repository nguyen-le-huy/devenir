import { api } from './api'

// ============ Types ============

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentMethod = 'Bank' | 'Crypto' | 'COD'
export type PaymentGateway = 'PayOS' | 'Coinbase' | 'NowPayments' | 'COD'

export interface OrderItem {
    name: string
    sku: string
    color: string
    size: string
    quantity: number
    price: number
    image: string
    mainImage?: string
    hoverImage?: string
}

export interface ShippingAddress {
    street: string
    city: string
    postalCode: string
    phone: string
}

export interface OrderUser {
    _id: string
    username?: string
    email: string
    firstName?: string
    lastName?: string
    phone?: string
}

export interface Order {
    _id: string
    user: OrderUser
    orderItems: OrderItem[]
    shippingAddress: ShippingAddress
    deliveryMethod: 'home' | 'store'
    deliveryWindow: 'standard' | 'next' | 'nominated'
    paymentMethod: PaymentMethod
    paymentGateway: PaymentGateway
    paymentResult?: {
        id?: string
        status?: string
        update_time?: string
        email_address?: string
    }
    paymentIntent?: {
        gatewayOrderCode?: number
        paymentLinkId?: string
        checkoutUrl?: string
        amount?: number
        currency?: string
        status?: string
    }
    totalPrice: number
    originalTotalPrice?: number
    shippingPrice: number
    trackingNumber?: string
    estimatedDelivery?: string
    shippedAt?: string
    status: OrderStatus
    paidAt?: string
    deliveredAt?: string
    cancelledAt?: string
    appliedGiftCode?: string
    createdAt: string
    updatedAt: string
    // Virtuals
    subtotal?: number
    totalItems?: number
    isPaid?: boolean
    isDelivered?: boolean
}

export interface OrderListFilters {
    page?: number
    limit?: number
    status?: OrderStatus | 'all'
    search?: string
    sort?: 'newest' | 'oldest' | 'total-high' | 'total-low'
    paymentMethod?: PaymentMethod | 'all'
    startDate?: string
    endDate?: string
}

export interface OrderListResponse {
    success: boolean
    data: Order[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
    stats: {
        total: number
        pending: number
        paid: number
        shipped: number
        delivered: number
        cancelled: number
    }
}

export interface OrderDetailResponse {
    success: boolean
    data: Order
}

export interface OrderStatsResponse {
    success: boolean
    data: {
        period: string
        orders: {
            total: number
            pending: number
            paid: number
            shipped: number
            delivered: number
            cancelled: number
            last24h: number
        }
        revenue: {
            total: number
            orderCount: number
            avgOrderValue: number
        }
    }
}

// ============ Helper Functions ============

const normalizeFilters = (filters: OrderListFilters = {}) => {
    const params: Record<string, unknown> = {}
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    if (filters.search) params.search = filters.search
    if (filters.status && filters.status !== 'all') params.status = filters.status
    if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod
    if (filters.sort) params.sort = filters.sort
    if (filters.startDate) params.startDate = filters.startDate
    if (filters.endDate) params.endDate = filters.endDate
    return params
}

// ============ Service ============

export const orderService = {
    getOrders: async (filters?: OrderListFilters): Promise<OrderListResponse> => {
        const response = await api.get('/admin/orders', { params: normalizeFilters(filters) })
        return response.data
    },

    getOrderById: async (id: string): Promise<OrderDetailResponse> => {
        const response = await api.get(`/admin/orders/${id}`)
        return response.data
    },

    getStats: async (period = '30d'): Promise<OrderStatsResponse> => {
        const response = await api.get('/admin/orders/stats', { params: { period } })
        return response.data
    },

    updateOrderStatus: async (id: string, status: OrderStatus): Promise<OrderDetailResponse> => {
        const response = await api.patch(`/admin/orders/${id}/status`, { status })
        return response.data
    },

    deleteOrder: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/admin/orders/${id}`)
        return response.data
    },
}
