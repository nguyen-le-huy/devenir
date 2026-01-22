import { hybridClassifyIntent } from '../orchestrators/intent-classifier.js';
import { productAdvice } from '../specialized/product-advisor.service.js';
import { adminAnalytics } from '../specialized/admin-analytics.service.js';
import { sizeRecommendation } from '../specialized/size-advisor.service.js';
import { orderLookup } from '../specialized/order-lookup.service.js';
import { policyFAQ } from '../specialized/policy-faq.service.js';
import { handleAddToCart } from '../specialized/add-to-cart.service.js';
import { styleMatcher } from '../specialized/style-matcher.service.js';
import { ConversationManager } from '../orchestrators/conversation-manager.js';
import { buildCustomerContext } from '../utils/customerContext.js';
import { logChatInteraction } from '../../chatbotAnalytics.js';

export class RAGService {
    constructor() {
        this.conversationManager = new ConversationManager();
    }

    /**
     * Main chat handler - routes to appropriate service
     */
    async chat(userId, message, conversationHistory = []) {
        const startTime = Date.now();

        try {
            // 1. Parallel: Classify intent + Get conversation context + Build customer context
            const [intentResult, context, customerContext] = await Promise.all([
                hybridClassifyIntent(message, conversationHistory),
                this.conversationManager.getContext(userId, conversationHistory),
                buildCustomerContext(userId)
            ]);

            const { intent, confidence, extracted_info } = intentResult;

            console.log(`🎯 Intent: ${intent}, Confidence: ${confidence}`);
            console.log(`💬 Recent messages: ${context.recent_messages?.length || 0}`);
            console.log(`👤 Customer context: ${customerContext.hasContext ? 'Available' : 'None'} (${customerContext.userProfile?.customerType || 'Unknown'})`);

            let result;

            // 2. Merge customer context into conversation context
            const enrichedContext = {
                ...context,
                customerContext: customerContext.contextString,
                customerProfile: customerContext.userProfile,
                hasCustomerContext: customerContext.hasContext
            };

            // 3. Route to appropriate service
            switch (intent) {
                case 'product_advice':
                    result = await productAdvice(message, enrichedContext);
                    break;

                case 'size_recommendation':
                    result = await sizeRecommendation(message, extracted_info, enrichedContext);
                    break;

                case 'style_matching':
                    result = await styleMatcher(message, enrichedContext);
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

                case 'admin_analytics':
                    // Security check usually happens at API gateway/middleware level, 
                    // but we double check context here if needed.
                    result = await adminAnalytics(message, extracted_info, enrichedContext);
                    break;

                default:
                    // Check if user is admin to provide relevant default help
                    if (customerContext.userProfile?.role === 'admin') {
                        result = {
                            answer: "Chào Admin!\nMình là trợ lý vận hành AI. Mình có thể giúp bạn:\n\n- Báo cáo: Doanh thu hôm nay, tuần này...\n- Kho hàng: Kiểm tra tồn kho, sản phẩm...\n- Khách hàng: Tra cứu thông tin, lịch sử mua...\n- Đơn hàng: Kiểm tra trạng thái đơn, vận chuyển...\n\nBạn cần số liệu gì ngay lúc này?",
                            intent: 'general_admin'
                        };
                    } else {
                        result = {
                            answer: "Mình có thể giúp bạn:\n• Tư vấn sản phẩm\n• Tư vấn size\n• Gợi ý phối đồ\n• Tra cứu đơn hàng\n• Thông tin thanh toán & giao hàng\n\nBạn cần mình hỗ trợ gì nhé?",
                            intent: 'general'
                        };
                    }
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

            // 5. Log analytics
            const responseTime = Date.now() - startTime;
            await logChatInteraction({
                userId,
                sessionId: context.conversation_id,
                intent,
                hasPersonalization: customerContext.hasContext,
                customerType: customerContext.userProfile?.customerType,
                engagementScore: customerContext.intelligence?.engagementScore,
                responseTime,
                messageLength: message.length,
                productsShown: result.suggested_products?.length || 0
            }).catch(err => {
                console.error('⚠️ Analytics logging failed (non-critical):', err.message);
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
