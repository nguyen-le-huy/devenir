import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { connectAdminSocket, getSocket } from '@/lib/socket'
import { ORDER_KEYS } from '@/hooks/useOrders'
import { SHIPMENT_KEYS } from '@/hooks/useShipments'

const PRODUCT_EVENTS = ['product:created', 'product:updated', 'product:deleted']
const VARIANT_EVENTS = ['variant:created', 'variant:updated', 'variant:deleted', 'variant:bulk-updated']
const CATEGORY_EVENTS = ['category:created', 'category:updated', 'category:deleted']
const ORDER_EVENTS = ['order:status-updated']

type Listener = (payload?: any) => void

export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = connectAdminSocket()
    const listeners: Array<{ event: string; handler: Listener }> = []

    const invalidateProducts = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.lists(), refetchType: 'active' })
    }

    const invalidateVariants = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.lists(), refetchType: 'active' })
    }

    const invalidateCategories = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.all, refetchType: 'active' })
    }

    const invalidateOrders = () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all, refetchType: 'active' })
    }

    const invalidateShipments = () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENT_KEYS.all, refetchType: 'active' })
    }

    const handleProductEvent: Listener = (payload) => {
      invalidateProducts()
      invalidateCategories()
      if (payload?.event === 'product:deleted') {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.products.detail(payload?.productId || '') })
      }
      if (payload?.event === 'product:updated' && payload?.productId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.detail(payload.productId), refetchType: 'active' })
      }
    }

    const handleVariantEvent: Listener = (payload) => {
      invalidateVariants()
      invalidateProducts()
      if (payload?.productId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.variants.byProduct(payload.productId), refetchType: 'active' })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.detail(payload.productId), refetchType: 'active' })
      }
    }

    const handleCategoryEvent: Listener = () => {
      invalidateCategories()
      invalidateProducts()
    }

    const handleOrderEvent: Listener = () => {
      invalidateOrders()
      invalidateShipments()
    }

    PRODUCT_EVENTS.forEach((event) => {
      const handler = (payload: any) => handleProductEvent({ ...payload, event })
      socket.on(event, handler)
      listeners.push({ event, handler })
    })

    VARIANT_EVENTS.forEach((event) => {
      const handler = (payload: any) => handleVariantEvent({ ...payload, event })
      socket.on(event, handler)
      listeners.push({ event, handler })
    })

    CATEGORY_EVENTS.forEach((event) => {
      const handler = (payload: any) => handleCategoryEvent({ ...payload, event })
      socket.on(event, handler)
      listeners.push({ event, handler })
    })

    ORDER_EVENTS.forEach((event) => {
      const handler = (payload: any) => handleOrderEvent({ ...payload, event })
      socket.on(event, handler)
      listeners.push({ event, handler })
    })

    const socketInstance = getSocket()
    const errorHandler = (error: Error) => {
      console.error('Socket error', error)
    }
    const disconnectHandler = () => {
      console.warn('Realtime connection disconnected')
    }
    socketInstance.on('connect_error', errorHandler)
    socketInstance.on('disconnect', disconnectHandler)

    return () => {
      listeners.forEach(({ event, handler }) => socket.off(event, handler))
      socketInstance.off('connect_error', errorHandler)
      socketInstance.off('disconnect', disconnectHandler)
    }
  }, [queryClient])
}
