/**
 * Event Tracker - Client-side analytics (DEPRECATED)
 * ⚠️ This file is deprecated. Use trackingService.ts instead.
 * Kept for backward compatibility only.
 */

interface TrackingEvent {
    type: string;
    sessionId: string;
    timestamp: string;
    data: any;
    page: string;
    referrer: string;
    retryCount?: number;
}

class EventTracker {
    private queue: TrackingEvent[];
    private flushInterval: number;
    private apiEndpoint: string;

    constructor() {
        this.queue = [];
        this.flushInterval = 5000;
        this.apiEndpoint = '/api/events/track';
        // Disabled auto-flush to prevent conflicts with new tracking system
        // this.startAutoFlush();
    }

    /**
     * Track an event (NO-OP - redirects to new tracking service)
     * @param {string} eventType - Type of event
     * @param {object} data - Event data
     */
    track(_eventType: string, _data: any = {}) {
        // Just log for debugging, don't queue
        // console.log('[EventTracker DEPRECATED] Event:', eventType, data);
        return; // Don't queue events anymore
        /*
        const event: TrackingEvent = {
          type: eventType,
          sessionId: this.getSessionId(),
          timestamp: new Date().toISOString(),
          data,
          page: window.location.pathname,
          referrer: document.referrer,
        };
    
        this.queue.push(event);
    
        // Flush immediately for critical events
        if (this.isCriticalEvent(eventType)) {
          this.flush();
        }
    
        // Flush if queue is full
        if (this.queue.length >= this.maxQueueSize) {
          this.flush();
        }
        */
    }

    /**
     * Flush queued events to server
     */
    async flush() {
        if (this.queue.length === 0) return;

        const events = [...this.queue];
        this.queue = [];

        try {
            const userId = this.getUserId();

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` }),
                },
                body: JSON.stringify({ events, userId }),
            });

            if (!response.ok) {
                throw new Error(`Event tracking failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Event tracking error:', error);
            // Re-queue failed events (max 1 retry)
            if (events[0]?.retryCount !== 1) {
                this.queue.push(...events.map((e) => ({ ...e, retryCount: 1 })));
            }
        }
    }

    /**
     * Start auto-flush interval
     */
    startAutoFlush() {
        // Flush periodically
        setInterval(() => this.flush(), this.flushInterval);

        // Flush before page unload
        window.addEventListener('beforeunload', () => {
            this.flush();
        });

        // Flush when page becomes hidden (tab switch, minimize)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flush();
            }
        });
    }

    /**
     * Check if event is critical (requires immediate flush)
     */
    isCriticalEvent(type: string): boolean {
        return ['purchase', 'checkout_complete', 'add_to_cart'].includes(type);
    }

    /**
     * Get or create session ID
     */
    getSessionId(): string {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }

    /**
     * Get user ID from localStorage
     */
    getUserId(): string {
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            return user?._id || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    /**
     * Get auth token from localStorage
     */
    getAuthToken(): string | null {
        try {
            const authState = localStorage.getItem('devenir-auth');
            if (authState) {
                const parsed = JSON.parse(authState);
                if (parsed?.state?.token) return parsed.state.token;
            }
        } catch (e) { }
        return localStorage.getItem('token');
    }
}

// Singleton instance
export const tracker = new EventTracker();

// ========== CONVENIENCE METHODS ==========

export const trackEvent = {
    // Product events
    productView: (data: { productId: string; productName: string; variantId?: string; category: string; brand: string; color?: string; size?: string; price?: number; sku?: string }) =>
        tracker.track('product_view', data),

    productClick: (productId: string, position: number, list: string) =>
        tracker.track('product_click', { productId, position, list }),

    addToCart: (product: any, quantity: number) =>
        tracker.track('add_to_cart', {
            product: {
                productId: product._id,
                name: product.name,
                category: product.category,
                brand: product.brand,
                color: product.color,
                size: product.size,
                price: product.price,
            },
            quantity,
        }),

    removeFromCart: (productId: string) => tracker.track('remove_from_cart', { productId }),

    // Search events
    search: (query: string, resultsCount: number, filters: any) =>
        tracker.track('search', { query, resultsCount, filters }),

    filterApply: (filters: any) => tracker.track('filter_apply', { filters }),

    // Engagement events
    chatStart: () => tracker.track('chat_start', {}),

    chatMessage: (data: any) => tracker.track('chat_message', data),

    wishlistAdd: (productId: string, productName: string) =>
        tracker.track('wishlist_add', { productId, productName }),

    wishlistRemove: (productId: string) => tracker.track('wishlist_remove', { productId }),

    // Checkout events
    checkoutStart: (cartValue: number, itemCount: number) =>
        tracker.track('checkout_start', { cartValue, itemCount }),

    checkoutComplete: (orderId: string, totalAmount: number, items: any[]) =>
        tracker.track('checkout_complete', { orderId, totalAmount, items }),

    purchase: (orderId: string, totalAmount: number, items: any[]) =>
        tracker.track('purchase', {
            orderId,
            totalAmount,
            items: items.map((item) => ({
                productId: item.product || item.productId,
                name: item.name,
                category: item.category,
                brand: item.brand,
                color: item.color,
                size: item.size,
                price: item.price,
                quantity: item.quantity,
            })),
        }),

    // Email events (for email campaign tracking)
    emailOpen: (campaignId: string) => tracker.track('email_open', { campaignId }),

    emailClick: (campaignId: string, linkUrl: string) => tracker.track('email_click', { campaignId, linkUrl }),

    // Page engagement
    scrollDepth: (percentage: number) => tracker.track('scroll_depth', { percentage }),

    timeOnPage: (duration: number) => tracker.track('time_on_page', { duration }),
};

// Auto-track page views
let pageViewTracked = false;
window.addEventListener('load', () => {
    if (!pageViewTracked) {
        tracker.track('page_view', {
            path: window.location.pathname,
            title: document.title,
        });
        pageViewTracked = true;
    }
});
