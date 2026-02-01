import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackingService } from '@/core/services/trackingService'

/**
 * Hook to automatically track page views and navigation
 * Usage: Add `useTracking()` in your App.tsx or layout component
 */
export function useTracking() {
  const location = useLocation()
  const previousPath = useRef<string>('')

  useEffect(() => {
    // Don't track if path hasn't changed
    if (location.pathname === previousPath.current) return

    previousPath.current = location.pathname

    // Track page view
    trackingService.trackPageView(location.pathname, document.title)

    // Extract and track category views from URL patterns
    const categoryMatch = location.pathname.match(/^\/(products|shop)\/([^/]+)/)
    if (categoryMatch) {
      const category = decodeURIComponent(categoryMatch[2])
      trackingService.trackCategoryView(category)
    }

    // Track collection views
    const collectionMatch = location.pathname.match(/^\/collections\/([^/]+)/)
    if (collectionMatch) {
      const collection = decodeURIComponent(collectionMatch[1])
      trackingService.trackCategoryView(collection, 'collection')
    }
  }, [location.pathname])

  return null
}

/**
 * Hook to track specific events manually
 * Usage: const track = useTrackEvent()
 *        track('custom_event', { data: 'value' })
 */
export function useTrackEvent() {
  return (eventType: string, data?: Record<string, any>) => {
    trackingService.trackEvent(eventType, data)
  }
}

/**
 * Hook to track product views
 * Usage: useProductTracking(product, selectedVariant)
 */
export function useProductTracking(
  product: {
    _id: string
    name: string
    category?: string
    basePrice?: number
  } | null,
  selectedSize?: string,
  selectedColor?: string
) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!product || hasTracked.current) return

    // Track initial product view
    trackingService.trackProductView({
      ...product,
      selectedSize,
      selectedColor,
    })

    hasTracked.current = true
  }, [product?._id]) // Only track once per product

  // Track variant changes
  useEffect(() => {
    if (!product || !hasTracked.current) return
    if (!selectedSize && !selectedColor) return

    trackingService.trackEvent('variant_selected', {
      productId: product._id,
      productName: product.name,
      size: selectedSize,
      color: selectedColor,
    })
  }, [selectedSize, selectedColor])

  return null
}
