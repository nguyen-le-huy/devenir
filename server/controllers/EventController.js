import EventEmitter from 'events';
import EventLog from '../models/EventLogModel.js';
import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';

// Event processor singleton
class EventProcessor extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    // Product interaction events
    this.on('product_view', this.handleProductView.bind(this));
    this.on('add_to_cart', this.handleAddToCart.bind(this));
    this.on('purchase', this.handlePurchase.bind(this));

    // Search & filter events
    this.on('search', this.handleSearch.bind(this));
    this.on('filter_apply', this.handleFilterApply.bind(this));

    // Chat events
    this.on('chat_message', this.handleChatMessage.bind(this));

    // Engagement events
    this.on('wishlist_add', this.handleWishlistAdd.bind(this));
  }

  // ========== EVENT HANDLERS ==========

  async handleProductView({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { productId, category } = data;

      // Track category interest - count views in last 7 days
      const viewCount = await EventLog.countDocuments({
        userId,
        type: 'product_view',
        'data.category': category,
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      // If viewed category 5+ times → add interest tag
      if (viewCount >= 5) {
        await this.addTag(userId, `interested:${category}`);
      }

      // Check repeated views of same product
      const productViewCount = await EventLog.countDocuments({
        userId,
        type: 'product_view',
        'data.productId': productId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (productViewCount >= 3) {
        await this.addNote(userId, {
          type: 'opportunity',
          content: `Xem sản phẩm ${data.productName} nhiều lần - Quan tâm cao nhưng chưa mua`,
        });
      }
    } catch (error) {
      console.error('handleProductView error:', error);
    }
  }

  async handleAddToCart({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { product } = data;
      const { category, brand, color, size } = product;

      // Track browsing intent
      await this.addTag(userId, `browsing:${category}`);

      // Track color preference
      if (color) {
        const colorTag = `color:${color.toLowerCase()}`;
        await this.addTag(userId, colorTag);
      }

      // Track size preference
      if (size) {
        const sizeTag = `size:${size}`;
        await this.addTag(userId, sizeTag);
      }

      // Track brand interest
      if (brand) {
        const brandTag = `brand:${brand.toLowerCase()}`;
        await this.addTag(userId, brandTag);
      }
    } catch (error) {
      console.error('handleAddToCart error:', error);
    }
  }

  async handlePurchase({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { items } = data;

      // Generate auto tags from purchase
      await this.generateAutoTags(userId, items);

      // Analyze purchase patterns
      await this.analyzePurchasePatterns(userId, items);

      // Remove browsing tags (converted to purchase)
      await User.findByIdAndUpdate(userId, {
        $pull: {
          'customerProfile.tags': { $regex: /^browsing:/ },
        },
      });
    } catch (error) {
      console.error('handlePurchase error:', error);
    }
  }

  async handleSearch({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { query } = data;

      // Get recent searches (last 24h)
      const recentSearches = await EventLog.find({
        userId,
        type: 'search',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .sort('-timestamp')
        .limit(10)
        .lean();

      // Check for repeated searches
      const similarSearches = recentSearches.filter((s) =>
        s.data.query?.toLowerCase().includes(query.toLowerCase())
      );

      if (similarSearches.length >= 3) {
        await this.addNote(userId, {
          type: 'opportunity',
          content: `Tìm kiếm "${query}" nhiều lần - Cần tư vấn hoặc sản phẩm không đủ`,
        });
      }
    } catch (error) {
      console.error('handleSearch error:', error);
    }
  }

  async handleFilterApply({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { filters } = data;

      // Track filter preferences (brand, category, price range)
      if (filters.brand) {
        await this.addTag(userId, `brand:${filters.brand.toLowerCase()}`);
      }

      if (filters.category) {
        await this.addTag(userId, `category:${filters.category.toLowerCase()}`);
      }
    } catch (error) {
      console.error('handleFilterApply error:', error);
    }
  }

  async handleChatMessage({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { intent } = data;

      // Track consultation needs
      if (intent === 'size_recommendation') {
        await this.addTag(userId, 'needs:size-help');
      }

      if (intent === 'product_advice') {
        await this.addTag(userId, 'needs:consultation');
      }

      if (intent === 'style_matching') {
        await this.addTag(userId, 'needs:styling-advice');
      }
    } catch (error) {
      console.error('handleChatMessage error:', error);
    }
  }

  async handleWishlistAdd({ userId, data }) {
    if (userId === 'anonymous') return;

    try {
      const { productId } = data;

      // Track wishlist patterns
      const wishlistCount = await EventLog.countDocuments({
        userId,
        type: 'wishlist_add',
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      });

      // High wishlist activity but low purchases → potential issue
      if (wishlistCount > 5) {
        const purchaseCount = await Order.countDocuments({
          user: userId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        });

        if (purchaseCount === 0) {
          await this.addNote(userId, {
            type: 'opportunity',
            content: 'Nhiều wishlist nhưng chưa mua - Có thể do giá hoặc cần voucher',
          });
          await this.addTag(userId, 'behavior:wishlist-saver');
        }
      }
    } catch (error) {
      console.error('handleWishlistAdd error:', error);
    }
  }

  // ========== HELPER METHODS ==========

  async addTag(userId, tag) {
    try {
      await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { 'customerProfile.tags': tag },
        },
        { new: true }
      );
    } catch (error) {
      console.error('addTag error:', error);
    }
  }

  async addNote(userId, noteData) {
    try {
      // Check if similar note already exists (prevent duplicates)
      const user = await User.findById(userId).lean();
      const existingNotes = user?.customerProfile?.notesList || [];

      const isDuplicate = existingNotes.some(
        (note) =>
          note.type === noteData.type &&
          note.content.toLowerCase().includes(noteData.content.toLowerCase().substring(0, 20))
      );

      if (isDuplicate) return;

      await User.findByIdAndUpdate(userId, {
        $push: {
          'customerProfile.notesList': {
            ...noteData,
            createdBy: 'system',
            createdAt: new Date(),
            isPinned: false,
          },
        },
      });
    } catch (error) {
      console.error('addNote error:', error);
    }
  }

  async generateAutoTags(userId, purchasedItems) {
    try {
      const tags = new Set();

      // Extract unique values
      const categories = [...new Set(purchasedItems.map((i) => i.category).filter(Boolean))];
      const brands = [...new Set(purchasedItems.map((i) => i.brand).filter(Boolean))];
      const colors = [...new Set(purchasedItems.map((i) => i.color).filter(Boolean))];
      const sizes = [...new Set(purchasedItems.map((i) => i.size).filter(Boolean))];

      // Generate tags
      categories.forEach((cat) => tags.add(`category:${cat.toLowerCase()}`));
      brands.forEach((brand) => tags.add(`brand:${brand.toLowerCase()}`));
      colors.forEach((color) => tags.add(`color:${color.toLowerCase()}`));

      // Most common size
      if (sizes.length > 0) {
        const sizeFreq = sizes.reduce((acc, size) => {
          acc[size] = (acc[size] || 0) + 1;
          return acc;
        }, {});
        const mostCommonSize = Object.keys(sizeFreq).sort((a, b) => sizeFreq[b] - sizeFreq[a])[0];
        tags.add(`size:${mostCommonSize}`);
      }

      // Bulk update
      if (tags.size > 0) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { 'customerProfile.tags': { $each: Array.from(tags) } },
        });
      }
    } catch (error) {
      console.error('generateAutoTags error:', error);
    }
  }

  async analyzePurchasePatterns(userId, items) {
    try {
      // Get full purchase history
      const orders = await Order.find({ user: userId }).sort('-createdAt').limit(10).lean();

      if (orders.length === 0) return;

      const allItems = orders.flatMap((o) => o.orderItems);

      // Calculate average price
      const avgPrice = allItems.reduce((sum, i) => sum + (i.price || 0), 0) / allItems.length;
      const currentAvg = items.reduce((sum, i) => sum + (i.price || 0), 0) / items.length;

      // Detect premium upgrade
      if (currentAvg > avgPrice * 1.5) {
        await this.addTag(userId, 'behavior:premium-upgrade');
        await this.addNote(userId, {
          type: 'opportunity',
          content: `Nâng cấp budget ${Math.round((currentAvg / avgPrice - 1) * 100)}% - Upsell high-end products`,
        });
      }

      // Detect discount dependency
      const discountOrders = orders.filter((o) => o.discount > 0 || o.couponUsed);
      if (discountOrders.length / orders.length > 0.7) {
        await this.addTag(userId, 'behavior:sale-hunter');
      } else if (discountOrders.length / orders.length < 0.3) {
        await this.addTag(userId, 'behavior:full-price-buyer');
      }

      // Detect loyalty
      if (orders.length >= 5) {
        await this.addTag(userId, 'behavior:loyal-customer');
      }
    } catch (error) {
      console.error('analyzePurchasePatterns error:', error);
    }
  }
}

// Singleton instance
export const eventProcessor = new EventProcessor();

// ========== CONTROLLER METHODS ==========

/**
 * POST /api/events/track
 * Batch event tracking endpoint
 */
export const trackEvents = async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required',
      });
    }

    const userId = req.user?._id?.toString() || req.body.userId || 'anonymous';

    // Save events to database (bulk insert)
    const eventDocs = events.map((event) => ({
      userId,
      sessionId: event.sessionId,
      type: event.type,
      data: event.data || {},
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      page: event.page,
      referrer: event.referrer,
    }));

    await EventLog.insertMany(eventDocs);

    // Process events asynchronously (don't block response)
    setImmediate(() => {
      events.forEach((event) => {
        eventProcessor.emit(event.type, {
          userId,
          data: event.data || {},
          timestamp: event.timestamp,
        });
      });
    });

    res.json({
      success: true,
      processed: events.length,
    });
  } catch (error) {
    console.error('Event tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/events/stats/:userId
 * Get event statistics for a user
 */
export const getUserEventStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await EventLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      success: true,
      stats,
      period: `${days} days`,
    });
  } catch (error) {
    console.error('getUserEventStats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
