import { api } from './api'
import type { OrderItem, OrderUser, ShippingAddress } from './orderService'

export type ShipmentStatus = 'shipped' | 'delivered' | 'cancelled' | 'all'

export interface ShipmentFilters {
  status?: ShipmentStatus
  startDate?: string
  endDate?: string
}

export interface Shipment {
  _id: string
  user: OrderUser
  orderItems: Array<OrderItem & { productVariant?: string }>
  shippingAddress?: ShippingAddress
  status: 'shipped' | 'delivered' | 'cancelled'
  shippedAt?: string
  estimatedDelivery?: string
  deliveredAt?: string
  trackingNumber?: string
}

export interface ShipmentListResponse {
  success: boolean
  data: Shipment[]
}

export interface ShipmentDetailResponse {
  success: boolean
  data: Shipment
}

const normalizeFilters = (filters: ShipmentFilters = {}) => {
  const params: Record<string, unknown> = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  return params
}

export const shipmentService = {
  getShipments: async (filters?: ShipmentFilters): Promise<ShipmentListResponse> => {
    const response = await api.get('/admin/shipments', { params: normalizeFilters(filters) })
    return response.data
  },
  startShipment: async (id: string, trackingNumber?: string): Promise<ShipmentDetailResponse> => {
    const response = await api.post(`/admin/shipments/${id}/start`, { trackingNumber })
    return response.data
  },
  markDelivered: async (id: string): Promise<ShipmentDetailResponse> => {
    const response = await api.post(`/admin/shipments/${id}/deliver`)
    return response.data
  },
  cancelShipment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/shipments/${id}/cancel`)
    return response.data
  },
}
