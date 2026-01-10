/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client'

interface TrackingEvent {
  type: string
  data: Record<string, any>
  timestamp?: Date
}

class TrackingService {
  private socket: Socket | null = null
  private isInitialized = false
  private eventQueue: TrackingEvent[] = []
  private sessionStartTime: number = Date.now()
  private currentUserId: string | null = null

  /**
   * Get auth token from storage (handles Zustand persistence)
   */
  private getAuthToken(): string | null {
    try {
      const authState = localStorage.getItem('devenir-auth')
      if (authState) {
        const parsed = JSON.parse(authState)
        if (parsed?.state?.token) return parsed.state.token
      }
    } catch (e) { }
    return localStorage.getItem('token')
  }

  /**
   * Initialize tracking service with user authentication
   */
  init(userId?: string) {
    if (this.isInitialized) return

    this.currentUserId = userId || null
    const token = this.getAuthToken()

    // Initialize Socket.IO connection
    try {
      this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3111', {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      this.socket.on('connect', () => {
        if (import.meta.env.DEV) console.log('✅ Tracking socket connected')
        this.flushQueue()
      })

      this.socket.on('disconnect', () => {
        if (import.meta.env.DEV) console.log('❌ Tracking socket disconnected')
      })

      this.socket.on('error', (error) => {
        console.error('Tracking socket error:', error)
      })

      this.isInitialized = true

      // Track session start
      this.trackEvent('session_start', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      })

      // Setup beforeunload tracking
      this.setupSessionEndTracking()
    } catch (error) {
      console.error('Failed to initialize tracking:', error)
    }
  }

  /**
   * Track event with Socket.IO (realtime) + HTTP beacon (fallback)
   */
  trackEvent(type: string, data: Record<string, any> = {}) {
    const event: TrackingEvent = {
      type,
      data: {
        ...data,
        userId: this.currentUserId,
        sessionDuration: Date.now() - this.sessionStartTime,
      },
      timestamp: new Date(),
    }

    // Try Socket.IO first (realtime)
    if (this.socket?.connected) {
      this.socket.emit('track_event', event)
      if (import.meta.env.DEV) console.log(`📊 Tracked (Socket): ${type}`, data)
    } else {
      // Queue for later if socket not connected
      this.eventQueue.push(event)

      // Fallback to HTTP beacon immediately for critical events
      this.sendBeacon(event)
    }
  }

  /**
   * Track product view with variant details
   */
  trackProductView(product: {
    _id: string
    name: string
    category?: string
    basePrice?: number
    selectedSize?: string
    selectedColor?: string
  }) {
    this.trackEvent('product_view', {
      productId: product._id,
      productName: product.name,
      category: product.category,
      price: product.basePrice,
      selectedSize: product.selectedSize,
      selectedColor: product.selectedColor,
    })
  }

  /**
   * Track cart actions
   */
  trackCartAction(action: 'add' | 'remove' | 'update', item: {
    productId: string
    productName: string
    quantity: number
    price: number
    size?: string
    color?: string
  }) {
    const eventTypeMap = {
      add: 'add_to_cart',
      remove: 'remove_from_cart',
      update: 'update_cart_quantity',
    }

    this.trackEvent(eventTypeMap[action], {
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      color: item.color,
      totalValue: item.price * item.quantity,
    })
  }

  /**
   * Track search queries
   */
  trackSearch(query: string, filters?: Record<string, any>, resultsCount?: number) {
    this.trackEvent('search', {
      query,
      filters,
      resultsCount,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Track category browsing
   */
  trackCategoryView(category: string, subcategory?: string) {
    this.trackEvent('category_view', {
      category,
      subcategory,
    })
  }

  /**
   * Track page views
   */
  trackPageView(pagePath: string, pageTitle?: string) {
    this.trackEvent('page_view', {
      path: pagePath,
      title: pageTitle || document.title,
      referrer: document.referrer,
    })
  }

  /**
   * Track checkout steps
   */
  trackCheckout(step: 'initiated' | 'shipping' | 'payment' | 'completed', data?: Record<string, any>) {
    this.trackEvent('checkout', {
      step,
      ...data,
    })
  }

  /**
   * Flush queued events when socket reconnects
   */
  private flushQueue() {
    if (this.eventQueue.length === 0) return

    if (import.meta.env.DEV) console.log(`📤 Flushing ${this.eventQueue.length} queued events`)

    this.eventQueue.forEach(event => {
      this.socket?.emit('track_event', event)
    })

    this.eventQueue = []
  }

  /**
   * Send event via HTTP beacon (works even when page is closing)
   */
  private sendBeacon(event: TrackingEvent) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3111/api'
    const token = this.getAuthToken()

    const data = JSON.stringify({
      ...event,
      token, // Include token for authentication
    })

    // navigator.sendBeacon ensures data is sent even if page is closing
    const success = navigator.sendBeacon(`${apiUrl}/telemetry`, data)

    if (!success) {
      console.warn('Beacon failed, trying fetch with keepalive')
      fetch(`${apiUrl}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: data,
        keepalive: true, // Ensures request completes even if page closes
      }).catch(err => console.error('Failed to send tracking event:', err))
    } else {
      if (import.meta.env.DEV) console.log(`📡 Tracked (Beacon): ${event.type}`)
    }
  }

  /**
   * Track session end when user closes tab/browser
   */
  private setupSessionEndTracking() {
    const trackSessionEnd = () => {
      const sessionDuration = Date.now() - this.sessionStartTime

      this.sendBeacon({
        type: 'session_end',
        data: {
          userId: this.currentUserId,
          sessionDuration,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date(),
      })
    }

    // Track on page unload
    window.addEventListener('beforeunload', trackSessionEnd)

    // Track on visibility change (user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          duration: Date.now() - this.sessionStartTime,
        })
      } else {
        this.trackEvent('page_visible', {})
      }
    })
  }

  /**
   * Update current user ID (after login)
   */
  setUserId(userId: string) {
    this.currentUserId = userId
    if (import.meta.env.DEV) console.log('👤 Tracking user updated:', userId)
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.isInitialized = false
  }
}

// Singleton instance
export const trackingService = new TrackingService()

// Auto-initialize on module load (will init properly after user logs in)
if (typeof window !== 'undefined') {
  const userId = localStorage.getItem('userId') || undefined
  trackingService.init(userId)
}
