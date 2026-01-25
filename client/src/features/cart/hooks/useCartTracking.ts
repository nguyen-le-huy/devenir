import { useEffect, useRef, useCallback } from 'react'
import { trackingService } from '@/features/orders/api/trackingService'

interface CartItem {
  _id?: string
  product?: {
    _id: string
    name: string
    basePrice: number
  }
  productId?: string
  name?: string
  price?: number
  quantity: number
  size?: string
  color?: string
}

/**
 * Hook to track cart actions automatically
 * Wrap your cart functions with this hook's tracking methods
 */
export function useCartTracking() {
  const previousCartRef = useRef<Map<string, number>>(new Map())

  /**
   * Track when item is added to cart
   */
  const trackAddToCart = useCallback((item: CartItem) => {
    const productId = item.product?._id || item.productId || item._id
    const productName = item.product?.name || item.name || 'Unknown Product'
    const price = item.product?.basePrice || item.price || 0

    if (!productId) {
      console.warn('Cannot track cart action: missing product ID')
      return
    }

    trackingService.trackCartAction('add', {
      productId,
      productName,
      quantity: item.quantity,
      price,
      size: item.size,
      color: item.color,
    })
  }, [])

  /**
   * Track when item is removed from cart
   */
  const trackRemoveFromCart = useCallback((item: CartItem) => {
    const productId = item.product?._id || item.productId || item._id
    const productName = item.product?.name || item.name || 'Unknown Product'
    const price = item.product?.basePrice || item.price || 0

    if (!productId) return

    trackingService.trackCartAction('remove', {
      productId,
      productName,
      quantity: item.quantity,
      price,
      size: item.size,
      color: item.color,
    })
  }, [])

  /**
   * Track when cart quantity is updated
   */
  const trackUpdateCart = useCallback((item: CartItem, oldQuantity: number, newQuantity: number) => {
    const productId = item.product?._id || item.productId || item._id
    const productName = item.product?.name || item.name || 'Unknown Product'
    const price = item.product?.basePrice || item.price || 0

    if (!productId) return

    trackingService.trackCartAction('update', {
      productId,
      productName,
      quantity: newQuantity,
      price,
      size: item.size,
      color: item.color,
    })

    // Also track as remove if quantity decreased
    if (newQuantity < oldQuantity) {
      trackingService.trackEvent('cart_quantity_decreased', {
        productId,
        productName,
        oldQuantity,
        newQuantity,
        difference: oldQuantity - newQuantity,
      })
    }
  }, [])

  /**
   * Auto-detect cart changes and track them
   * Pass current cart items to automatically track changes
   */
  const trackCartChanges = useCallback((cartItems: CartItem[]) => {
    const currentCart = new Map<string, number>()
    
    cartItems.forEach(item => {
      const key = `${item.product?._id || item.productId}_${item.size}_${item.color}`
      currentCart.set(key, item.quantity)
    })

    // Compare with previous cart state
    const previousCart = previousCartRef.current

    // Detect additions
    currentCart.forEach((quantity, key) => {
      const prevQuantity = previousCart.get(key) || 0
      if (quantity > prevQuantity) {
        const item = cartItems.find(i => 
          `${i.product?._id || i.productId}_${i.size}_${i.color}` === key
        )
        if (item) {
          if (prevQuantity === 0) {
            trackAddToCart(item)
          } else {
            trackUpdateCart(item, prevQuantity, quantity)
          }
        }
      }
    })

    // Detect removals
    previousCart.forEach((prevQuantity, key) => {
      const currentQuantity = currentCart.get(key) || 0
      if (currentQuantity === 0 && prevQuantity > 0) {
        // Find item from previous state (if available)
        trackingService.trackEvent('item_removed_from_cart', {
          productKey: key,
          previousQuantity: prevQuantity,
        })
      }
    })

    // Update ref
    previousCartRef.current = currentCart
  }, [trackAddToCart, trackUpdateCart])

  /**
   * Track cart abandonment (when user leaves with items in cart)
   */
  useEffect(() => {
    const trackAbandonment = () => {
      const cartItems = previousCartRef.current
      if (cartItems.size > 0) {
        trackingService.trackEvent('cart_abandoned', {
          itemCount: cartItems.size,
          timestamp: new Date().toISOString(),
        })
      }
    }

    window.addEventListener('beforeunload', trackAbandonment)
    return () => window.removeEventListener('beforeunload', trackAbandonment)
  }, [])

  return {
    trackAddToCart,
    trackRemoveFromCart,
    trackUpdateCart,
    trackCartChanges,
  }
}

/**
 * Simple wrapper for manual cart tracking
 */
export function trackCartEvent(action: 'view' | 'open' | 'close', data?: Record<string, any>) {
  const eventMap = {
    view: 'cart_viewed',
    open: 'cart_opened',
    close: 'cart_closed',
  }

  trackingService.trackEvent(eventMap[action], data)
}
