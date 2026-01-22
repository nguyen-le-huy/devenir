import { llmProvider } from '../core/LLMProvider.js';
import { buildIntentClassificationPrompt } from '../generation/prompt-builder.js';

/**
 * Classify user intent from message
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages for context
 * @returns {Object} - { intent, confidence, extracted_info }
 */
export async function classifyIntent(message, conversationHistory = []) {
    const systemPrompt = buildIntentClassificationPrompt();

    // Build messages array with conversation history for context
    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 4 messages for context)
    const recentHistory = conversationHistory.slice(-4);
    for (const msg of recentHistory) {
        messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    try {
        const result = await llmProvider.jsonCompletion(messages, {
            temperature: 0.1
        });

        return {
            intent: result.intent || 'general',
            confidence: result.confidence || 0.5,
            extracted_info: result.extracted_info || {}
        };
    } catch (error) {
        console.error('Intent Classification Error:', error);
        // Return default intent on error
        return {
            intent: 'general',
            confidence: 0,
            extracted_info: {}
        };
    }
}

/**
 * Quick intent detection using keywords (fallback)
 * @param {string} message - User message
 */
export function quickIntentDetection(message) {
    const lowerMessage = message.toLowerCase();

    // Admin Analytics keywords (revenue, stock, customer info)
    const adminKeywords = [
        'doanh thu', 'revenue', 'bán được', 'lãi', 'doanh số',
        'tồn kho', 'stock', 'còn bao nhiêu cái', 'trong kho', 'hết', 'sắp hết', 'hết hàng', 'còn ít', 'cảnh báo', 'warning',
        'check kho', 'kiểm kho', 'số lượng',
        'thông tin khách', 'tìm user', 'lịch sử mua', 'customer', 'user', 'khách hàng',
        'check đơn', 'trạng thái đơn', 'admin', 'báo cáo',
        'xuất file', 'export', 'csv', 'file tồn kho'
    ];
    if (adminKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'admin_analytics', confidence: 0.95 };
    }

    // Special case: "Thông tin [Name]" or "Tìm [Name]" (Non-product) -> Admin Analytics (Customer Lookup)
    // We avoid routing "Thông tin sản phẩm" to admin by checking against product matchers
    if (lowerMessage.startsWith('thông tin ') || lowerMessage.startsWith('info ') || lowerMessage.startsWith('tìm ')) {
        const productIndicators = [
            'sản phẩm', 'product', 'áo', 'quần', 'váy', 'đầm', 'giày', 'túi', 'khăn', 'nước hoa',
            'size', 'màu', 'giá', 'chất liệu', 'shop', 'cửa hàng'
        ];
        const isProductQuery = productIndicators.some(k => lowerMessage.includes(k));

        if (!isProductQuery) {
            return { intent: 'admin_analytics', confidence: 0.95 };
        }
    }

    // HIGH PRIORITY: Product type keywords - route to product_advice immediately
    const highPriorityProductTypes = [
        'nước hoa', 'fragrance', 'perfume', 'cologne', 'eau de parfum',
        'scarf', 'khăn', 'jacket', 'áo khoác', 'sweater', 'áo len'
    ];
    if (highPriorityProductTypes.some(k => lowerMessage.includes(k))) {
        return { intent: 'product_advice', confidence: 0.85 };
    }

    // Size related keywords
    const sizeKeywords = ['size', 'số đo', 'chiều cao', 'cân nặng', 'form', 'vừa', 'rộng', 'chật'];
    if (sizeKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'size_recommendation', confidence: 0.7 };
    }

    // Order lookup keywords
    const orderKeywords = ['đơn hàng', 'theo dõi', 'tracking'];
    if (orderKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'order_lookup', confidence: 0.8 };
    }

    // Add to cart intent
    const addToCartKeywords = ['thêm vào bag', 'thêm vào giỏ', 'add to bag', 'add to cart', 'mua ngay', 'đặt hàng', 'muốn mua'];
    if (addToCartKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'add_to_cart', confidence: 0.9 };
    }

    // Style matching keywords
    const styleKeywords = ['phối', 'mix', 'match', 'outfit', 'kết hợp', 'mặc với'];
    if (styleKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'style_matching', confidence: 0.7 };
    }

    // Policy/FAQ keywords (payment, shipping, returns, location)
    const policyKeywords = [
        'payment', 'thanh toán', 'pay', 'shipping', 'giao hàng', 'ship', 'delivery', 'vận chuyển', 'phí ship', 'crypto', 'payos', 'nowpayments',
        // Location keywords
        'địa chỉ', 'ở đâu', 'cửa hàng', 'store', 'location', 'address', 'chỗ nào', 'showroom', 'chi nhánh', 'đường đi'
    ];
    if (policyKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'policy_faq', confidence: 0.8 };
    }

    // Return/exchange keywords
    const returnKeywords = ['đổi', 'trả', 'hoàn', 'refund', 'bảo hành'];
    if (returnKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'policy_faq', confidence: 0.7 };
    }

    // Product advice (default for product-related)
    const productKeywords = [
        // Search/want keywords + availability questions
        'tìm', 'muốn', 'cần', 'gợi ý', 'tư vấn', 'sản phẩm', 'bán', 'có bán', 'còn',
        // Product types
        'áo', 'quần', 'váy', 'đầm', 'jacket', 'coat', 'scarf', 'khăn', 'túi', 'bag', 'giày', 'boots',
        'nước hoa', 'fragrance', 'perfume', 'eau de parfum', 'cologne',
        'wallet', 'ví', 'tie', 'cà vạt', 'cufflink', 'sweater', 'áo len',
        'wallet', 'ví', 'tie', 'cà vạt', 'cufflink', 'sweater', 'áo len',
        // Product questions - origin, material, details
        'sản xuất', 'xuất xứ', 'made in', 'origin', 'chất liệu', 'nguyên liệu', 'material', 'fabric',
        'mô tả', 'chi tiết', 'thông tin', 'về sản phẩm', 'detail',
        // Stock/availability
        'còn hàng', 'hết hàng', 'in stock', 'available',
        // Price
        'giá', 'bao nhiêu', 'price', 'cost'
    ];
    if (productKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'product_advice', confidence: 0.6 };
    }

    // If message contains specific product name (detected by context), route to product_advice
    // This catches questions like "Happy Scarf được sản xuất tại đâu"
    const hasProductName = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(lowerMessage) ||
        lowerMessage.includes('scarf') ||
        lowerMessage.includes('polo') ||
        lowerMessage.includes('jacket') ||
        lowerMessage.includes('coat');
    if (hasProductName) {
        return { intent: 'product_advice', confidence: 0.6 };
    }

    return { intent: 'general', confidence: 0.5 };
}

/**
 * Hybrid intent classification (LLM + fallback)
 * @param {string} message - User message
 * @param {Array} conversationHistory - Previous messages for context
 */
export async function hybridClassifyIntent(message, conversationHistory = []) {
    try {
        // Check for high-priority keywords FIRST (bypass LLM)
        const quickResult = quickIntentDetection(message);

        // These intents have high confidence from keywords - use them directly
        if (quickResult.intent === 'admin_analytics' && quickResult.confidence >= 0.9) {
            console.log(`👮 Admin Analytics detected via keywords`);
            return quickResult;
        }

        if (quickResult.intent === 'policy_faq' && quickResult.confidence >= 0.7) {
            console.log(`📋 Policy FAQ detected via keywords`);
            return quickResult;
        }
        if (quickResult.intent === 'add_to_cart' && quickResult.confidence >= 0.8) {
            console.log(`🛒 Add to cart detected via keywords`);
            return quickResult;
        }
        // High-priority product type keywords (nước hoa, fragrance, etc.) - bypass LLM
        if (quickResult.intent === 'product_advice' && quickResult.confidence >= 0.85) {
            console.log(`🛍️ Product type detected via keywords`);
            return quickResult;
        }

        // Try LLM classification (with conversation history)
        const llmResult = await classifyIntent(message, conversationHistory);

        // If confidence is low, use keyword-based as backup
        if (llmResult.confidence < 0.6) {
            if (quickResult.confidence > llmResult.confidence) {
                return quickResult;
            }
        }

        return llmResult;
    } catch (error) {
        // Fallback to keyword-based detection
        return quickIntentDetection(message);
    }
}
