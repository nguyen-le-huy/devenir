import EventLog from '../models/EventLogModel.js';
import User from '../models/UserModel.js';
import Order from '../models/OrderModel.js';
import Product from '../models/ProductModel.js';

/**
 * Customer Intelligence Service
 * Analyze EventLog data to generate behavioral insights, tag suggestions, and customer profiles
 */

// ========== CORE ANALYSIS FUNCTIONS ==========

/**
 * Analyze customer behavior from EventLog data
 * @param {String} userId - MongoDB ObjectId of user
 * @param {Object} options - { days: 30, includeAnonymous: false }
 * @returns {Object} Behavioral insights
 */
export const analyzeCustomerBehavior = async (userId, options = {}) => {
  const { days = 30, includeAnonymous = false } = options;
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const query = {
    timestamp: { $gte: startDate }
  };
  
  if (!includeAnonymous) {
    query.userId = userId;
  } else {
    // Include both userId and sessionId events for this user
    const user = await User.findById(userId);
    query.$or = [
      { userId },
      { 'data.email': user?.email }
    ];
  }

  const events = await EventLog.find(query).sort({ timestamp: 1 }).lean();

  // Aggregate data by event type
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  // Extract behavioral patterns
  const browsing = analyzeBrowsingBehavior(events);
  const shopping = analyzeShoppingBehavior(events);
  const engagement = analyzeEngagementBehavior(events);
  const search = analyzeSearchBehavior(events);

  return {
    userId,
    period: { days, startDate, endDate: new Date() },
    eventCounts,
    totalEvents: events.length,
    browsing,
    shopping,
    engagement,
    search,
    lastActivity: events.length > 0 ? events[events.length - 1].timestamp : null
  };
};

/**
 * Analyze browsing patterns (product views, categories, brands)
 */
const analyzeBrowsingBehavior = (events) => {
  const productViews = events.filter(e => e.type === 'product_view');
  
  // Category interests with view counts
  const categoryInterests = {};
  const brandInterests = {};
  const colorInterests = {};
  const sizeInterests = {};
  const viewedProducts = new Set();

  productViews.forEach(event => {
    const { category, brand, color, size, productId } = event.data || {};
    
    if (category) categoryInterests[category] = (categoryInterests[category] || 0) + 1;
    if (brand) brandInterests[brand] = (brandInterests[brand] || 0) + 1;
    if (color) colorInterests[color] = (colorInterests[color] || 0) + 1;
    if (size) sizeInterests[size] = (sizeInterests[size] || 0) + 1;
    if (productId) viewedProducts.add(productId);
  });

  // Sort by interest level (view count)
  const topCategories = Object.entries(categoryInterests)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, confidence: Math.min(count / 5, 1) }));

  const topBrands = Object.entries(brandInterests)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, confidence: Math.min(count / 3, 1) }));

  const topColors = Object.entries(colorInterests)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, confidence: Math.min(count / 3, 1) }));

  return {
    totalViews: productViews.length,
    uniqueProducts: viewedProducts.size,
    averageViewsPerProduct: productViews.length / (viewedProducts.size || 1),
    topCategories,
    topBrands,
    topColors,
    preferredSizes: Object.keys(sizeInterests).sort((a,b) => sizeInterests[b] - sizeInterests[a])
  };
};

/**
 * Analyze shopping behavior (cart, checkout, purchase)
 */
const analyzeShoppingBehavior = (events) => {
  const addToCart = events.filter(e => e.type === 'add_to_cart');
  const removeFromCart = events.filter(e => e.type === 'remove_from_cart');
  const purchases = events.filter(e => e.type === 'purchase');

  // Cart abandonment rate
  const cartItemsAdded = addToCart.length;
  const cartItemsRemoved = removeFromCart.length;
  const purchasedItems = purchases.reduce((sum, p) => sum + (p.data.items?.length || 0), 0);
  
  const abandonmentRate = cartItemsAdded > 0 
    ? ((cartItemsAdded - purchasedItems) / cartItemsAdded) 
    : 0;

  // Purchase patterns
  const totalSpent = purchases.reduce((sum, p) => sum + (p.data.totalAmount || 0), 0);
  const averageOrderValue = purchases.length > 0 ? totalSpent / purchases.length : 0;

  // Price sensitivity analysis
  const priceSensitivity = analyzePriceSensitivity(events);

  // Product preferences from cart
  const cartCategories = {};
  const cartBrands = {};
  
  addToCart.forEach(event => {
    const { category, brand } = event.data || {};
    if (category) cartCategories[category] = (cartCategories[category] || 0) + 1;
    if (brand) cartBrands[brand] = (cartBrands[brand] || 0) + 1;
  });

  return {
    cartActions: {
      itemsAdded: cartItemsAdded,
      itemsRemoved: cartItemsRemoved,
      abandonmentRate: Math.round(abandonmentRate * 100)
    },
    purchases: {
      count: purchases.length,
      totalSpent,
      averageOrderValue: Math.round(averageOrderValue),
      itemsPurchased: purchasedItems
    },
    priceSensitivity,
    preferredCategories: Object.keys(cartCategories).sort((a,b) => cartCategories[b] - cartCategories[a]),
    preferredBrands: Object.keys(cartBrands).sort((a,b) => cartBrands[b] - cartBrands[a])
  };
};

/**
 * Analyze price sensitivity from filter and purchase behavior
 */
const analyzePriceSensitivity = (events) => {
  const filterEvents = events.filter(e => e.type === 'filter_apply');
  const purchases = events.filter(e => e.type === 'purchase');

  // Count filter uses
  const priceLowFilters = filterEvents.filter(e => e.data.sortBy === 'Price Low').length;
  const priceHighFilters = filterEvents.filter(e => e.data.sortBy === 'Price High').length;

  // Analyze purchase prices
  const purchasePrices = [];
  purchases.forEach(p => {
    p.data.items?.forEach(item => {
      if (item.price) purchasePrices.push(item.price);
    });
  });

  const avgPurchasePrice = purchasePrices.length > 0 
    ? purchasePrices.reduce((a,b) => a+b, 0) / purchasePrices.length 
    : 0;

  // Determine sensitivity
  let sensitivity = 'medium';
  if (priceLowFilters > priceHighFilters * 2) {
    sensitivity = 'high'; // Price-conscious
  } else if (priceHighFilters > priceLowFilters && avgPurchasePrice > 1000000) {
    sensitivity = 'low'; // Premium buyer
  }

  return {
    level: sensitivity,
    filterUsage: {
      priceLow: priceLowFilters,
      priceHigh: priceHighFilters
    },
    averagePurchasePrice: Math.round(avgPurchasePrice)
  };
};

/**
 * Analyze engagement (search, chat, wishlist)
 */
const analyzeEngagementBehavior = (events) => {
  const searches = events.filter(e => e.type === 'search');
  const chatMessages = events.filter(e => e.type === 'chat_message');
  const chatStarts = events.filter(e => e.type === 'chat_start');
  const wishlistAdds = events.filter(e => e.type === 'wishlist_add');

  // Chat intent analysis
  const intents = {};
  chatMessages.forEach(e => {
    const intent = e.data?.intent || 'general';
    intents[intent] = (intents[intent] || 0) + 1;
  });

  // Consultation needs
  const needsConsultation = 
    intents['consultation'] > 0 || 
    intents['size-help'] > 0 || 
    intents['styling-advice'] > 0;

  return {
    searchCount: searches.length,
    chatSessions: chatStarts.length,
    chatMessages: chatMessages.length,
    wishlistItems: wishlistAdds.length,
    chatIntents: intents,
    needsConsultation,
    engagementScore: calculateEngagementScore({
      searches: searches.length,
      chats: chatMessages.length,
      wishlist: wishlistAdds.length
    })
  };
};

/**
 * Calculate engagement score (0-100)
 */
const calculateEngagementScore = ({ searches, chats, wishlist }) => {
  const searchScore = Math.min(searches * 5, 30);
  const chatScore = Math.min(chats * 10, 40);
  const wishlistScore = Math.min(wishlist * 10, 30);
  
  return Math.min(searchScore + chatScore + wishlistScore, 100);
};

/**
 * Analyze search behavior (queries, patterns, needs)
 */
const analyzeSearchBehavior = (events) => {
  const searches = events.filter(e => e.type === 'search');
  
  const queries = [];
  const queryMap = {};
  
  searches.forEach(e => {
    const query = e.data?.query?.toLowerCase();
    if (query) {
      queries.push({
        query,
        timestamp: e.timestamp,
        resultsCount: e.data?.resultsCount || 0
      });
      queryMap[query] = (queryMap[query] || 0) + 1;
    }
  });

  // Detect repeated searches (potential unmet needs)
  const repeatedQueries = Object.entries(queryMap)
    .filter(([, count]) => count >= 3)
    .map(([query, count]) => ({ query, count }));

  // Detect no-result searches
  const noResultQueries = queries
    .filter(q => q.resultsCount === 0)
    .map(q => q.query);

  return {
    totalSearches: searches.length,
    uniqueQueries: Object.keys(queryMap).length,
    repeatedQueries,
    noResultQueries: [...new Set(noResultQueries)],
    needsAssistance: repeatedQueries.length > 0 || noResultQueries.length > 0
  };
};

/**
 * Get accurate order statistics from Orders collection
 * @param {String} userId - User ID
 * @returns {Object} Order stats
 */
const getOrderStats = async (userId) => {
  const orders = await Order.find({ 
    user: userId,
    status: { $nin: ['cancelled', 'failed'] } // Exclude cancelled orders
  }).lean();

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const lastOrderDate = orders.length > 0 
    ? orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
    : null;

  // Get product categories from orders
  const categoryPurchases = {};
  const brandPurchases = {};
  
  orders.forEach(order => {
    order.orderItems?.forEach(item => {
      if (item.category) {
        categoryPurchases[item.category] = (categoryPurchases[item.category] || 0) + 1;
      }
      if (item.brand) {
        brandPurchases[item.brand] = (brandPurchases[item.brand] || 0) + 1;
      }
    });
  });

  return {
    totalOrders,
    totalSpent,
    avgOrderValue,
    lastOrderDate,
    categoryPurchases,
    brandPurchases
  };
};

/**
 * FALLBACK: Analyze Order history when EventLog is not available
 * @param {String} userId - User ID
 * @returns {Object} Behavior data from orders
 */
const analyzeOrderHistory = async (userId) => {
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (orders.length === 0) {
    return {
      userId,
      totalEvents: 0,
      eventCounts: {},
      browsing: { totalViews: 0, categoriesViewed: [], topCategories: [] },
      shopping: { 
        cartActions: { itemsAdded: 0, itemsRemoved: 0, abandonmentRate: 0 },
        purchaseHistory: { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 }
      },
      engagement: { 
        engagementScore: 0,
        chatMessages: 0,
        chatIntents: {},
        needsConsultation: false 
      },
      search: { totalSearches: 0, uniqueQueries: 0 },
      lastActivity: null
    };
  }

  // Calculate purchase metrics
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Calculate recency (days since last order)
  const lastOrderDate = orders[0]?.createdAt;
  const daysSinceLastOrder = lastOrderDate 
    ? Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  // Extract categories from orders (OrderModel has snapshot data, not refs)
  const categories = {};
  const colors = {};
  const sizes = {};
  
  orders.forEach(order => {
    order.orderItems?.forEach(item => {
      // orderItems have direct fields: name, color, size, sku, etc.
      if (item.color) colors[item.color] = (colors[item.color] || 0) + item.quantity;
      if (item.size) sizes[item.size] = (sizes[item.size] || 0) + item.quantity;
      
      // Try to extract category from SKU or name (e.g., "T-SHIRT-001" -> "t-shirt")
      const skuParts = item.sku?.split('-');
      if (skuParts && skuParts.length > 0) {
        const categoryFromSku = skuParts[0].toLowerCase();
        categories[categoryFromSku] = (categories[categoryFromSku] || 0) + item.quantity;
      }
    });
  });

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));

  // Calculate engagement score based on order history
  let engagementScore = 0;
  if (totalOrders >= 5) engagementScore += 40; // Loyal customer
  else if (totalOrders >= 2) engagementScore += 20;
  
  if (totalSpent >= 10000) engagementScore += 40; // High spender
  else if (totalSpent >= 1000) engagementScore += 20;
  
  if (daysSinceLastOrder <= 30) engagementScore += 20; // Recent activity
  else if (daysSinceLastOrder <= 90) engagementScore += 10;

  return {
    userId,
    period: { days: 365, startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), endDate: new Date() },
    totalEvents: totalOrders,
    eventCounts: { purchase: totalOrders },
    browsing: {
      totalViews: totalOrders * 3, // Estimate
      categoriesViewed: Object.keys(categories),
      topCategories,
      topColors: Object.entries(colors).slice(0, 3).map(([color, count]) => ({ color, count })),
      topSizes: Object.entries(sizes).slice(0, 3).map(([size, count]) => ({ size, count }))
    },
    shopping: {
      cartActions: { 
        itemsAdded: totalOrders,
        itemsRemoved: 0,
        abandonmentRate: 0 
      },
      purchaseHistory: {
        totalOrders,
        totalSpent,
        avgOrderValue,
        frequency: totalOrders >= 5 ? 'frequent' : totalOrders >= 2 ? 'repeat' : 'one-time',
        recency: daysSinceLastOrder,
        lastPurchase: lastOrderDate
      }
    },
    engagement: {
      engagementScore,
      chatMessages: 0,
      chatIntents: {},
      needsConsultation: false
    },
    search: {
      totalSearches: 0,
      uniqueQueries: 0
    },
    lastActivity: lastOrderDate,
    dataSource: 'orders' // Flag to indicate this is from Order fallback
  };
};

// ========== SUGGESTION GENERATORS ==========

/**
 * Generate suggested tags based on behavior analysis
 * @param {Object} behavior - Output from analyzeCustomerBehavior()
 * @returns {Array} Suggested tags with confidence scores
 */
export const getSuggestedTags = (behavior) => {
  const suggestions = [];

  // Handle Order fallback data
  if (behavior.dataSource === 'orders') {
    const { totalOrders, totalSpent, avgOrderValue } = behavior.shopping.purchaseHistory;
    
    // VIP/Loyalty tags
    if (totalOrders >= 5 && totalSpent >= 10000) {
      suggestions.push({
        tag: 'tier:vip',
        reason: `${totalOrders} orders, $${totalSpent.toLocaleString()} spent`,
        confidence: 1.0,
        type: 'tier'
      });
    } else if (totalOrders >= 3) {
      suggestions.push({
        tag: 'behavior:loyal_customer',
        reason: `${totalOrders} repeat purchases`,
        confidence: 0.9,
        type: 'behavior'
      });
    }

    // Spending behavior
    if (avgOrderValue >= 1000) {
      suggestions.push({
        tag: 'behavior:high_value',
        reason: `AOV: $${avgOrderValue.toFixed(0)}`,
        confidence: 0.85,
        type: 'behavior'
      });
    }

    // Category interests from orders
    behavior.browsing.topCategories.forEach(cat => {
      suggestions.push({
        tag: `interested:${cat.category.toLowerCase()}`,
        reason: `Purchased ${cat.count} items in ${cat.category}`,
        confidence: 0.8,
        type: 'interest'
      });
    });

    return suggestions.slice(0, 5); // Limit to top 5
  }

  // Original EventLog-based logic
  // Category interests
  behavior.browsing.topCategories.forEach(cat => {
    if (cat.confidence >= 0.6) {
      suggestions.push({
        tag: `interested:${cat.name.toLowerCase()}`,
        reason: `Viewed ${cat.name} products ${cat.count} times`,
        confidence: cat.confidence,
        type: 'interest'
      });
    }
  });

  // Brand preferences
  behavior.browsing.topBrands.forEach(brand => {
    if (brand.confidence >= 0.7) {
      suggestions.push({
        tag: `brand:${brand.name.toLowerCase()}`,
        reason: `Frequently views ${brand.name} products`,
        confidence: brand.confidence,
        type: 'preference'
      });
    }
  });

  // Color preferences
  behavior.browsing.topColors.forEach(color => {
    if (color.confidence >= 0.7) {
      suggestions.push({
        tag: `color:${color.name.toLowerCase()}`,
        reason: `Prefers ${color.name} color (${color.count} views)`,
        confidence: color.confidence,
        type: 'preference'
      });
    }
  });

  // Size preferences
  if (behavior.browsing.preferredSizes.length > 0) {
    const topSize = behavior.browsing.preferredSizes[0];
    if (topSize !== 'Free Size') {
      suggestions.push({
        tag: `size:${topSize.toLowerCase()}`,
        reason: `Frequently views size ${topSize}`,
        confidence: 0.8,
        type: 'preference'
      });
    }
  }

  // Behavioral tags
  const { priceSensitivity } = behavior.shopping;
  if (priceSensitivity.level === 'high') {
    suggestions.push({
      tag: 'behavior:price_conscious',
      reason: `Frequently uses "Price Low" filter (${priceSensitivity.filterUsage.priceLow} times)`,
      confidence: 0.85,
      type: 'behavior'
    });
  } else if (priceSensitivity.level === 'low') {
    suggestions.push({
      tag: 'behavior:premium_buyer',
      reason: `Average purchase: ${priceSensitivity.averagePurchasePrice.toLocaleString()}đ`,
      confidence: 0.9,
      type: 'behavior'
    });
  }

  // Engagement tags
  if (behavior.engagement.needsConsultation) {
    suggestions.push({
      tag: 'needs:consultation',
      reason: 'Frequently asks for styling/size advice in chat',
      confidence: 0.9,
      type: 'needs'
    });
  }

  // Cart abandonment
  if (behavior.shopping.cartActions.abandonmentRate > 50 && behavior.shopping.cartActions.itemsAdded >= 3) {
    suggestions.push({
      tag: 'behavior:cart_abandoner',
      reason: `${behavior.shopping.cartActions.abandonmentRate}% abandonment rate`,
      confidence: 0.75,
      type: 'behavior'
    });
  }

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Generate suggested notes based on behavior analysis
 * @param {Object} behavior - Output from analyzeCustomerBehavior()
 * @returns {Array} Suggested notes
 */
export const getSuggestedNotes = (behavior) => {
  const notes = [];

  // Handle Order fallback data
  if (behavior.dataSource === 'orders') {
    const { totalOrders, totalSpent, avgOrderValue, recency } = behavior.shopping.purchaseHistory;
    
    // VIP customer notes
    if (totalOrders >= 5 && totalSpent >= 10000) {
      notes.push({
        type: 'context',
        content: `Khách hàng VIP - ${totalOrders} đơn hàng, tổng $${totalSpent.toLocaleString()}. Ưu tiên phục vụ cao nhất.`,
        confidence: 1.0,
        priority: 'high'
      });
    }

    // Winback opportunity
    if (totalOrders >= 1 && recency > 90) {
      notes.push({
        type: 'opportunity',
        content: `Chưa mua hàng ${recency} ngày - Gửi email winback với ưu đãi đặc biệt 15-20% off`,
        confidence: 0.9,
        priority: 'high'
      });
    } else if (totalOrders >= 1 && recency > 30) {
      notes.push({
        type: 'opportunity',
        content: `${recency} ngày kể từ lần mua cuối - Nhắc nhở với new arrivals hoặc cross-sell`,
        confidence: 0.8,
        priority: 'medium'
      });
    }

    // High AOV customer
    if (avgOrderValue >= 1000) {
      notes.push({
        type: 'context',
        content: `AOV cao ($${avgOrderValue.toFixed(0)}) - Khách hàng chất lượng, có thể upsell premium products`,
        confidence: 0.85,
        priority: 'medium'
      });
    }

    // Loyal but not VIP yet
    if (totalOrders >= 3 && totalOrders < 5) {
      notes.push({
        type: 'opportunity',
        content: `Khách hàng trung thành (${totalOrders} đơn) - Mời tham gia VIP program hoặc loyalty rewards`,
        confidence: 0.9,
        priority: 'medium'
      });
    }

    return notes.slice(0, 5); // Limit to top 5
  }

  // Original EventLog-based logic
  // Repeated searches → opportunity note
  if (behavior.search.repeatedQueries.length > 0) {
    behavior.search.repeatedQueries.forEach(q => {
      notes.push({
        type: 'opportunity',
        content: `Khách hàng tìm kiếm "${q.query}" ${q.count} lần - cần tư vấn sản phẩm phù hợp`,
        confidence: 0.9,
        priority: 'high'
      });
    });
  }

  // No-result searches → product gap
  if (behavior.search.noResultQueries.length > 0) {
    notes.push({
      type: 'feedback',
      content: `Tìm kiếm không có kết quả: ${behavior.search.noResultQueries.join(', ')}`,
      confidence: 1.0,
      priority: 'medium'
    });
  }

  // High cart abandonment → follow-up needed
  if (behavior.shopping.cartActions.abandonmentRate > 70 && behavior.shopping.cartActions.itemsAdded >= 5) {
    notes.push({
      type: 'opportunity',
      content: `Tỷ lệ bỏ giỏ hàng cao (${behavior.shopping.cartActions.abandonmentRate}%) - cân nhắc gửi email nhắc nhở hoặc mã giảm giá`,
      confidence: 0.85,
      priority: 'high'
    });
  }

  // Consultation needs from chat
  if (behavior.engagement.needsConsultation && behavior.engagement.chatMessages >= 3) {
    const topIntent = Object.entries(behavior.engagement.chatIntents)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topIntent) {
      const intentMap = {
        'size-help': 'tư vấn size/fit',
        'styling-advice': 'tư vấn phối đồ/styling',
        'consultation': 'tư vấn chung về sản phẩm',
        'product-recommendation': 'gợi ý sản phẩm phù hợp'
      };
      
      notes.push({
        type: 'consultation',
        content: `Khách hàng cần ${intentMap[topIntent[0]] || 'tư vấn'} - đã chat ${behavior.engagement.chatMessages} lần`,
        confidence: 0.9,
        priority: 'high'
      });
    }
  }

  // High engagement but no purchase → nurture lead
  if (behavior.engagement.engagementScore >= 60 && behavior.shopping.purchases.count === 0) {
    notes.push({
      type: 'opportunity',
      content: `Khách hàng tương tác tích cực (engagement score: ${behavior.engagement.engagementScore}) nhưng chưa mua - cần nurture với ưu đãi đặc biệt`,
      confidence: 0.8,
      priority: 'high'
    });
  }

  // Loyal customer (multiple purchases)
  if (behavior.shopping.purchases.count >= 3) {
    notes.push({
      type: 'context',
      content: `Khách hàng trung thành - Đã mua ${behavior.shopping.purchases.count} đơn, tổng ${behavior.shopping.purchases.totalSpent.toLocaleString()}đ. Cân nhắc VIP program.`,
      confidence: 1.0,
      priority: 'medium'
    });
  }

  return notes.sort((a, b) => {
    // Sort by priority then confidence
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.confidence - a.confidence;
  });
};

/**
 * Generate comprehensive customer intelligence report
 * @param {String} userId - MongoDB ObjectId of user
 * @param {Object} options - Analysis options
 * @returns {Object} Full intelligence report
 */
export const generateCustomerIntelligence = async (userId, options = {}) => {
  // HYBRID APPROACH: Get both EventLog behavior + Order data
  let behavior = await analyzeCustomerBehavior(userId, options);
  const orderStats = await getOrderStats(userId);

  // Merge shopping data with accurate order metrics
  if (behavior.totalEvents > 0) {
    // Has EventLog data - merge with order stats
    behavior.shopping.purchases = {
      count: orderStats.totalOrders,
      totalSpent: orderStats.totalSpent,
      averageOrderValue: Math.round(orderStats.avgOrderValue),
      itemsPurchased: orderStats.totalOrders, // Use order count as proxy
      lastOrderDate: orderStats.lastOrderDate
    };
    
    // Update cart abandonment if we have orders
    if (orderStats.totalOrders > 0 && behavior.shopping.cartActions.itemsAdded > 0) {
      const actualPurchases = orderStats.totalOrders;
      const cartAdds = behavior.shopping.cartActions.itemsAdded;
      behavior.shopping.cartActions.abandonmentRate = Math.round(
        ((cartAdds - actualPurchases) / cartAdds) * 100
      );
    }
    
    behavior.dataSource = 'hybrid'; // EventLog + Orders
  } else {
    // FALLBACK: No EventLog - use Order history
    console.log('⚠️ No EventLog found, using Order data fallback...');
    behavior = await analyzeOrderHistory(userId);
  }

  const suggestedTags = getSuggestedTags(behavior);
  const suggestedNotes = getSuggestedNotes(behavior);

  // Get current user data
  const user = await User.findById(userId)
    .select('email customerProfile tags notesList')
    .lean();

  // Calculate confidence in suggestions
  const avgTagConfidence = suggestedTags.length > 0
    ? suggestedTags.reduce((sum, t) => sum + t.confidence, 0) / suggestedTags.length
    : 0;

  return {
    userId,
    user: {
      email: user?.email,
      tier: user?.customerProfile?.tier,
      currentTags: user?.tags || [],
      currentNotes: user?.notesList?.length || 0
    },
    behavior,
    suggestions: {
      tags: suggestedTags,
      notes: suggestedNotes,
      confidence: Math.round(avgTagConfidence * 100)
    },
    insights: {
      customerType: determineCustomerType(behavior),
      nextBestAction: getNextBestAction(behavior),
      riskLevel: calculateRiskLevel(behavior)
    },
    generatedAt: new Date()
  };
};

/**
 * Determine customer type based on behavior
 */
const determineCustomerType = (behavior) => {
  // Handle Order fallback data
  if (behavior.dataSource === 'orders') {
    const { totalOrders, totalSpent, avgOrderValue } = behavior.shopping.purchaseHistory;
    
    if (totalOrders >= 5 && totalSpent >= 10000) {
      return 'VIP Premium';
    }
    if (totalOrders >= 3) {
      return 'Loyal Customer';
    }
    if (totalOrders >= 1) {
      return 'Repeat Customer';
    }
    return 'New Visitor';
  }

  // Original EventLog-based logic
  const { purchases, priceSensitivity } = behavior.shopping;
  const { engagementScore } = behavior.engagement;

  if (purchases.count >= 5 && purchases.averageOrderValue > 2000000) {
    return 'VIP Premium';
  }
  if (purchases.count >= 3) {
    return 'Loyal Customer';
  }
  if (engagementScore >= 70 && purchases.count === 0) {
    return 'High-Intent Browser';
  }
  if (priceSensitivity.level === 'high') {
    return 'Price-Conscious Shopper';
  }
  if (behavior.browsing.totalViews >= 10 && purchases.count === 0) {
    return 'Window Shopper';
  }
  
  return 'New Visitor';
};

/**
 * Get next best action recommendation
 */
const getNextBestAction = (behavior) => {
  // Handle Order fallback data
  if (behavior.dataSource === 'orders') {
    const { totalOrders, totalSpent, recency } = behavior.shopping.purchaseHistory;
    
    if (totalOrders >= 5 && totalSpent >= 10000) {
      return {
        action: 'vip_exclusive',
        message: 'Offer VIP exclusive preview of new collection',
        priority: 'high'
      };
    }
    if (recency > 90) {
      return {
        action: 'winback_campaign',
        message: `Last purchase ${recency} days ago - Send winback offer with 15% discount`,
        priority: 'high'
      };
    }
    if (totalOrders >= 3) {
      return {
        action: 'loyalty_reward',
        message: 'Thank loyal customer with special gift or points',
        priority: 'medium'
      };
    }
    return {
      action: 'continue_monitoring',
      message: 'Continue tracking purchase behavior',
      priority: 'low'
    };
  }

  // Original EventLog-based logic
  const { purchases, cartActions } = behavior.shopping;
  const { needsConsultation } = behavior.engagement;
  const { repeatedQueries } = behavior.search;

  if (needsConsultation) {
    return {
      action: 'offer_consultation',
      message: 'Offer personalized styling consultation via chat or email',
      priority: 'high'
    };
  }

  if (cartActions.abandonmentRate > 70 && cartActions.itemsAdded >= 3) {
    return {
      action: 'send_cart_reminder',
      message: 'Send abandoned cart email with 10% discount code',
      priority: 'high'
    };
  }

  if (repeatedQueries.length > 0) {
    return {
      action: 'product_recommendation',
      message: `Recommend products matching: ${repeatedQueries.map(q => q.query).join(', ')}`,
      priority: 'medium'
    };
  }

  if (purchases.count >= 3) {
    return {
      action: 'vip_upgrade',
      message: 'Invite to VIP program with exclusive benefits',
      priority: 'medium'
    };
  }

  if (behavior.browsing.totalViews >= 15 && purchases.count === 0) {
    return {
      action: 'first_purchase_incentive',
      message: 'Send first-time buyer discount (15% off)',
      priority: 'medium'
    };
  }

  return {
    action: 'monitor',
    message: 'Continue monitoring behavior patterns',
    priority: 'low'
  };
};

/**
 * Calculate churn/risk level
 */
const calculateRiskLevel = (behavior) => {
  // Handle Order fallback data
  if (behavior.dataSource === 'orders') {
    const { totalOrders, recency } = behavior.shopping.purchaseHistory;
    
    if (totalOrders >= 1 && recency >= 90) {
      return { level: 'high', reason: `No activity in ${recency} days` };
    }
    if (totalOrders >= 1 && recency >= 30) {
      return { level: 'medium', reason: `Last order ${recency} days ago` };
    }
    return { level: 'low', reason: 'Active customer' };
  }

  // Original EventLog-based logic
  const daysSinceLastActivity = behavior.lastActivity
    ? Math.floor((new Date() - new Date(behavior.lastActivity)) / (1000 * 60 * 60 * 24))
    : 999;

  const { purchases, cartActions } = behavior.shopping;

  // High risk: Previous customer, no activity in 30+ days
  if (purchases.count >= 1 && daysSinceLastActivity >= 30) {
    return { level: 'high', reason: `No activity in ${daysSinceLastActivity} days` };
  }

  // Medium risk: High cart abandonment
  if (cartActions.abandonmentRate > 80 && cartActions.itemsAdded >= 5) {
    return { level: 'medium', reason: `${cartActions.abandonmentRate}% cart abandonment` };
  }

  // Low risk: Active or recent customer
  if (daysSinceLastActivity <= 7 || purchases.count >= 2) {
    return { level: 'low', reason: 'Active customer' };
  }

  return { level: 'medium', reason: 'Normal activity' };
};
