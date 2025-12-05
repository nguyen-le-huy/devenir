import { openai, MODELS } from '../../../config/openai.js';
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
        const response = await openai.chat.completions.create({
            model: MODELS.CHAT_FAST, // Use faster model for classification
            response_format: { type: 'json_object' },
            messages,
            temperature: 0.1
        });

        const result = JSON.parse(response.choices[0].message.content);

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

    // Size related keywords
    const sizeKeywords = ['size', 'số đo', 'chiều cao', 'cân nặng', 'form', 'vừa', 'rộng', 'chật'];
    if (sizeKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'size_recommendation', confidence: 0.7 };
    }

    // Order lookup keywords
    const orderKeywords = ['đơn hàng', 'theo dõi', 'tracking', 'giao hàng', 'vận chuyển'];
    if (orderKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'order_lookup', confidence: 0.8 };
    }

    // Style matching keywords
    const styleKeywords = ['phối', 'mix', 'match', 'outfit', 'kết hợp', 'mặc với'];
    if (styleKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'style_matching', confidence: 0.7 };
    }

    // Return/exchange keywords
    const returnKeywords = ['đổi', 'trả', 'hoàn', 'refund', 'bảo hành'];
    if (returnKeywords.some(k => lowerMessage.includes(k))) {
        return { intent: 'return_exchange', confidence: 0.7 };
    }

    // Product advice (default for product-related)
    const productKeywords = ['tìm', 'muốn', 'cần', 'gợi ý', 'tư vấn', 'sản phẩm', 'áo', 'quần', 'váy'];
    if (productKeywords.some(k => lowerMessage.includes(k))) {
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
        // Try LLM classification first (with conversation history)
        const llmResult = await classifyIntent(message, conversationHistory);

        // If confidence is low, use keyword-based as backup
        if (llmResult.confidence < 0.6) {
            const quickResult = quickIntentDetection(message);
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
