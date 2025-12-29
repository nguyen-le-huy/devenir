import mongoose from 'mongoose';

const eventLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // Product events
        'product_view',
        'product_click',
        'add_to_cart',
        'remove_from_cart',
        'update_cart_quantity',
        'variant_selected',
        'cart_quantity_decreased',
        'item_removed_from_cart',
        // Search & filter events
        'search',
        'search_result_click',
        'search_filter_applied',
        'search_no_results',
        'search_autocomplete',
        'filter_apply',
        // Navigation events
        'page_view',
        'category_view',
        'page_hidden',
        'page_visible',
        // Session events
        'session_start',
        'session_end',
        // Wishlist events
        'wishlist_add',
        'wishlist_remove',
        // Chat events
        'chat_start',
        'chat_message',
        // Checkout events
        'checkout',
        'checkout_start',
        'checkout_complete',
        'purchase',
        // Cart events
        'cart_viewed',
        'cart_opened',
        'cart_closed',
        'cart_abandoned',
        // Engagement events
        'email_open',
        'email_click',
        'scroll_depth',
        'time_on_page',
      ],
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      expires: 7776000, // Auto-delete after 90 days (TTL index)
    },
    page: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
  }
);

// Compound indexes for efficient queries
eventLogSchema.index({ userId: 1, timestamp: -1 });
eventLogSchema.index({ type: 1, timestamp: -1 });
eventLogSchema.index({ sessionId: 1, timestamp: -1 });

const EventLog = mongoose.model('EventLog', eventLogSchema);

export default EventLog;
