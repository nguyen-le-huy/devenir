/**
 * RAG Service Constants
 * Centralized configuration and magic values
 * 
 * @module RAGConstants
 * @version 2.0.0
 */

// ============================================
// EMBEDDING CONFIGURATION
// ============================================

// IMPORTANT: These values must match your Pinecone index configuration
export const EMBEDDING_DIMENSIONS = 1536;

// ============================================
// VECTOR SEARCH DEFAULTS
// ============================================

export const VECTOR_SEARCH_TOP_K = 50;
export const RERANK_TOP_N = 5;

// ============================================
// METADATA TYPES
// ============================================

export const METADATA_TYPES = {
    PRODUCT_INFO: 'product_info',
    VARIANT_INFO: 'variant_info'
};

// ============================================
// INTENTS
// ============================================

/**
 * All supported intent types for customer-facing chat
 */
export const INTENTS = {
    PRODUCT_ADVICE: 'product_advice',
    SIZE_RECOMMENDATION: 'size_recommendation',
    STYLE_MATCHING: 'style_matching',
    ORDER_LOOKUP: 'order_lookup',
    POLICY_FAQ: 'policy_faq',
    ADD_TO_CART: 'add_to_cart',
    GENERAL: 'general'
};

// Legacy export for backward compatibility
export const INTENT_TYPES = INTENTS;

/**
 * Admin-only intent types
 */
export const ADMIN_INTENTS = {
    ANALYTICS: 'admin_analytics',
    REVENUE: 'revenue',
    CUSTOMER_LOOKUP: 'customer_lookup',
    CUSTOMER_STATS: 'customer_stats',
    PRODUCT_INVENTORY: 'product_inventory',
    ORDER_STATUS: 'order_status',
    INVENTORY_EXPORT: 'inventory_export',
    REVENUE_EXPORT: 'revenue_export',
    CUSTOMER_EXPORT: 'customer_export'
};

// ============================================
// RAG CONFIGURATION
// ============================================

/**
 * Main RAG service configuration
 */
export const RAG_CONFIG = {
    // Vector Search
    VECTOR: {
        TOP_K: 20,
        MIN_SCORE: 0.7,
        NAMESPACE: 'products'
    },

    // LLM Settings
    LLM: {
        DEFAULT_MODEL: 'gpt-4o-mini',
        FAST_MODEL: 'gpt-4o-mini',
        EMBEDDING_MODEL: 'text-embedding-3-small',
        MAX_TOKENS: 800,
        TEMPERATURE: 0.3,
        TIMEOUT_MS: 30000,
        MAX_RETRIES: 3
    },

    // Context Management
    CONTEXT: {
        HISTORY_LIMIT: 10,
        RECENT_MESSAGES_LIMIT: 5,
        ENTITY_CACHE_TTL: 300000, // 5 minutes
        CONVERSATION_TIMEOUT: 1800000 // 30 minutes
    },

    // Cache TTLs (in seconds)
    CACHE: {
        INTENT_TTL: 300,      // 5 minutes
        VECTOR_TTL: 3600,     // 1 hour
        KNOWLEDGE_TTL: 1800,  // 30 minutes
        COLOR_TTL: 3600       // 1 hour
    },

    // Rate Limiting
    RATE_LIMIT: {
        REQUESTS_PER_MINUTE: 60,
        WINDOW_MS: 60000
    },

    // Performance SLAs
    SLA: {
        REQUEST_TIMEOUT_MS: 10000,
        P95_LATENCY_MS: 2000,
        CACHE_HIT_TARGET: 0.5
    }
};

// ============================================
// KEYWORD PATTERNS
// ============================================

/**
 * Keywords for quick intent detection
 */
export const INTENT_KEYWORDS = {
    // Admin Analytics
    ADMIN: {
        REVENUE: ['doanh thu', 'doanh số', 'revenue', 'sales', 'bán được'],
        INVENTORY: ['tồn kho', 'còn hàng', 'inventory', 'stock', 'hàng hết'],
        CUSTOMER: ['khách hàng', 'customer', 'người mua', 'client'],
        ORDER: ['đơn hàng', 'order', 'vận chuyển', 'giao hàng'],
        EXPORT: ['xuất file', 'export', 'tải về', 'download']
    },

    // Size Recommendation
    SIZE: {
        KEYWORDS: ['size', 'cỡ', 'số', 'vừa', 'mặc vừa', 'chọn size'],
        MEASUREMENTS: ['cao', 'nặng', 'kg', 'cm', 'chiều cao', 'cân nặng']
    },

    // Style Matching
    STYLE: {
        KEYWORDS: ['phối', 'match', 'kết hợp', 'đi cùng', 'mặc với'],
        OCCASIONS: ['đi làm', 'đi chơi', 'dự tiệc', 'hẹn hò', 'wedding']
    },

    // Policy FAQ
    POLICY: {
        KEYWORDS: ['đổi trả', 'hoàn tiền', 'ship', 'giao hàng', 'thanh toán', 'bảo hành']
    },

    // Add to Cart
    CART: {
        KEYWORDS: ['thêm vào giỏ', 'add to cart', 'mua', 'đặt hàng', 'order']
    }
};

// ============================================
// SIZE CHARTS (Fallback data)
// ============================================

/**
 * Standard size chart data (Vietnamese men's sizing)
 */
export const SIZE_CHARTS = {
    SHIRT: {
        S: { chest: [88, 92], height: [160, 168], weight: [50, 58] },
        M: { chest: [92, 96], height: [168, 173], weight: [58, 65] },
        L: { chest: [96, 100], height: [173, 178], weight: [65, 72] },
        XL: { chest: [100, 104], height: [178, 183], weight: [72, 80] },
        XXL: { chest: [104, 108], height: [183, 188], weight: [80, 88] }
    },
    PANTS: {
        S: { waist: [72, 76], height: [160, 168], weight: [50, 58] },
        M: { waist: [76, 80], height: [168, 173], weight: [58, 65] },
        L: { waist: [80, 84], height: [173, 178], weight: [65, 72] },
        XL: { waist: [84, 88], height: [178, 183], weight: [72, 80] },
        XXL: { waist: [88, 92], height: [183, 188], weight: [80, 88] }
    }
};

// ============================================
// RESPONSE TEMPLATES
// ============================================

/**
 * Default response messages
 */
export const RESPONSES = {
    GENERAL_HELP: `Mình có thể giúp bạn:
• Tư vấn sản phẩm
• Tư vấn size
• Gợi ý phối đồ
• Tra cứu đơn hàng
• Thông tin thanh toán & giao hàng

Bạn cần mình hỗ trợ gì nhé?`,

    ADMIN_HELP: `Chào Admin!
Mình là trợ lý vận hành AI. Mình có thể giúp bạn:

• Báo cáo: Doanh thu hôm nay, tuần này...
• Kho hàng: Kiểm tra tồn kho, sản phẩm...
• Khách hàng: Tra cứu thông tin, lịch sử mua...
• Đơn hàng: Kiểm tra trạng thái đơn, vận chuyển...

Bạn cần số liệu gì ngay lúc này?`,

    ERROR_GENERIC: 'Xin lỗi, mình gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau ít phút.',

    UNAUTHORIZED: 'Bạn không có quyền truy cập chức năng này.',

    PRODUCT_NOT_FOUND: 'Xin lỗi, mình không tìm thấy sản phẩm phù hợp. Bạn có thể mô tả rõ hơn không?'
};

// ============================================
// MATERIAL PROPERTIES
// ============================================

/**
 * Material property mappings for product knowledge
 */
export const MATERIAL_PROPERTIES = {
    STRETCH: {
        HIGH: ['spandex', 'elastane', 'lycra', 'jersey', 'stretch'],
        MEDIUM: ['cotton blend', 'poly blend', 'knit'],
        LOW: ['100% cotton', 'linen', 'wool', 'denim']
    },
    BREATHABILITY: {
        HIGH: ['cotton', 'linen', 'bamboo', 'mesh'],
        MEDIUM: ['wool', 'silk', 'modal'],
        LOW: ['polyester', 'nylon', 'acrylic']
    },
    WARMTH: {
        HIGH: ['wool', 'cashmere', 'fleece', 'down'],
        MEDIUM: ['cotton', 'poly blend', 'denim'],
        LOW: ['linen', 'silk', 'mesh']
    }
};

// ============================================
// CATEGORY SLUGS
// ============================================

/**
 * Product category slug mappings
 */
export const CATEGORY_SLUGS = {
    POLO: 'ao-polo',
    TSHIRT: 'ao-thun',
    JACKET: 'ao-khoac',
    SHIRT: 'ao-so-mi',
    PANTS: 'quan',
    SHORTS: 'quan-short',
    ACCESSORIES: 'phu-kien'
};

// Freeze all constants to prevent modification
Object.freeze(INTENTS);
Object.freeze(INTENT_TYPES);
Object.freeze(ADMIN_INTENTS);
Object.freeze(RAG_CONFIG);
Object.freeze(INTENT_KEYWORDS);
Object.freeze(SIZE_CHARTS);
Object.freeze(RESPONSES);
Object.freeze(MATERIAL_PROPERTIES);
Object.freeze(CATEGORY_SLUGS);
Object.freeze(METADATA_TYPES);
