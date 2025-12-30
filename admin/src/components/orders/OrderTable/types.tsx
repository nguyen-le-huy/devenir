/**
 * Order Types & Helpers
 */
import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  IconLoader2,
  IconCheck,
  IconTruck,
  IconPackage,
  IconX,
} from '@tabler/icons-react'
import type { OrderStatus, OrderListFilters } from '@/hooks/useOrders'

// Re-export types from hooks
export type { Order, OrderListFilters, OrderStatus } from '@/hooks/useOrders'

// Status configuration
export interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  icon: React.ReactNode
}

// Status configs map
export const STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Chờ xử lý', variant: 'outline', icon: <IconLoader2 className="h-3 w-3" /> },
  paid: { label: 'Đã thanh toán', variant: 'default', icon: <IconCheck className="h-3 w-3" /> },
  shipped: { label: 'Đang giao', variant: 'secondary', icon: <IconTruck className="h-3 w-3" /> },
  delivered: { label: 'Hoàn thành', variant: 'default', icon: <IconPackage className="h-3 w-3" /> },
  cancelled: { label: 'Đã hủy', variant: 'destructive', icon: <IconX className="h-3 w-3" /> },
}

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Bank: 'Chuyển khoản',
  Crypto: 'Crypto',
  COD: 'COD',
}

// Default filters
export const DEFAULT_FILTERS: OrderListFilters = {
  page: 1,
  limit: 20,
  status: 'all',
  sort: 'newest',
}

// Helper functions
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)
}

export const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi })
}

export const getStatusConfig = (status: OrderStatus): StatusConfig => {
  return STATUS_CONFIGS[status] || STATUS_CONFIGS.pending
}

export const getPaymentMethodLabel = (method: string) => {
  return PAYMENT_METHOD_LABELS[method] || method
}
