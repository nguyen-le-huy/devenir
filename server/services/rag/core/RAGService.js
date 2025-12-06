import { hybridClassifyIntent } from '../orchestrators/intent-classifier.js';
import { productAdvice } from '../specialized/product-advisor.service.js';
import { sizeRecommendation } from '../specialized/size-advisor.service.js';
import { orderLookup } from '../specialized/order-lookup.service.js';
import { policyFAQ } from '../specialized/policy-faq.service.js';
import { handleAddToCart } from '../specialized/add-to-cart.service.js';
import { ConversationManager } from '../orchestrators/conversation-manager.js';

export class RAGService {
    constructor() {
        this.conversationManager = new ConversationManager();
    }

    /**
     * Main chat handler - routes to appropriate service
     */
    async chat(userId, message, conversationHistory = []) {
        try {
            // 1. Classify intent (hybrid: LLM + keyword fallback)
            const { intent, confidence, extracted_info } = await hybridClassifyIntent(message, conversationHistory);

            console.log(`🎯 Intent: ${intent}, Confidence: ${confidence}`);
            console.log(`📜 History length: ${conversationHistory.length}`);

            // 2. Get conversation context
            const context = await this.conversationManager.getContext(userId, conversationHistory);

            console.log(`💬 Recent messages: ${context.recent_messages?.length || 0}`);

            let result;

            // 3. Route to appropriate service
            switch (intent) {
                case 'product_advice':
                    result = await productAdvice(message, context);
                    break;

                case 'size_recommendation':
                    result = await sizeRecommendation(message, extracted_info, context);
                    break;

                case 'style_matching':
                    result = await productAdvice(`${message} (phối đồ)`, context);
                    break;

                case 'order_lookup':
                    result = await orderLookup(message, extracted_info, userId);
                    break;

                case 'policy_faq':
                    result = await policyFAQ(message, extracted_info);
                    break;

                case 'add_to_cart':
                    result = await handleAddToCart(message, extracted_info, context);
                    break;

                default:
                    result = {
                        answer: "Mình có thể giúp bạn:\n• Tư vấn sản phẩm\n• Tư vấn size\n• Gợi ý phối đồ\n• Tra cứu đơn hàng\n• Thông tin thanh toán & giao hàng\n\nBạn cần mình hỗ trợ gì nhé?",
                        intent: 'general'
                    };
            }

            // 4. Save to conversation history
            await this.conversationManager.addMessage(userId, {
                role: 'user',
                content: message,
                intent,
                timestamp: new Date()
            });

            await this.conversationManager.addMessage(userId, {
                role: 'assistant',
                content: result.answer,
                metadata: result,
                timestamp: new Date()
            });

            return {
                intent,
                confidence,
                ...result,
                conversation_id: context.conversation_id
            };

        } catch (error) {
            console.error('RAGService Error:', error);
            throw error;
        }
    }

    /**
     * Get conversation history for a user
     */
    async getHistory(userId, limit = 20) {
        return this.conversationManager.getHistory(userId, limit);
    }

    /**
     * Clear conversation context
     */
    async clearContext(userId) {
        return this.conversationManager.clearContext(userId);
    }
}
