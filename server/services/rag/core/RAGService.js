/**
 * RAG Service - Main Orchestrator
 * Enterprise-grade AI chat service with intent routing, context management,
 * and comprehensive error handling
 * 
 * @module RAGService
 * @version 2.0.0
 */

import { hybridClassifyIntent } from '../orchestrators/intent-classifier.js';
import { productAdvice } from '../specialized/product-advisor.service.js';
import { adminAnalytics } from '../specialized/admin-analytics.service.js';
import { sizeRecommendation } from '../specialized/size-advisor.service.js';
import { orderLookup } from '../specialized/order-lookup.service.js';
import { policyFAQ } from '../specialized/policy-faq.service.js';
import { handleAddToCart } from '../specialized/add-to-cart.service.js';
import { styleMatcher } from '../specialized/style-matcher.service.js';
import { EnhancedContextManager } from '../orchestrators/enhanced-context-manager.js';
import { buildCustomerContext } from '../utils/customerContext.js';
import chatbotAnalyticsService from '../../chatbotAnalytics.service.js';

// Enterprise imports
import {
    RAGError,
    ResponseGenerationError,
    IntentClassificationError,
    ContextRetrievalError,
    isRAGError,
    wrapError,
    getUserFriendlyMessage
} from '../utils/errors.js';
import logger, {
    logRequestStart,
    logRequestComplete,
    logError,
    logWarning,
    generateRequestId
} from '../utils/logger.js';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_USER_MESSAGE = "Mình có thể giúp bạn:\n• Tư vấn sản phẩm\n• Tư vấn size\n• Gợi ý phối đồ\n• Tra cứu đơn hàng\n• Thông tin thanh toán & giao hàng\n\nBạn cần mình hỗ trợ gì nhé?";

const DEFAULT_ADMIN_MESSAGE = "Chào Admin!\nMình là trợ lý vận hành AI. Mình có thể giúp bạn:\n\n• Báo cáo: Doanh thu hôm nay, tuần này...\n• Kho hàng: Kiểm tra tồn kho, sản phẩm...\n• Khách hàng: Tra cứu thông tin, lịch sử mua...\n• Đơn hàng: Kiểm tra trạng thái đơn, vận chuyển...\n\nBạn cần số liệu gì ngay lúc này?";

const ERROR_MESSAGE = "Xin lỗi, mình gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau ít phút.";

// ============================================
// RAG SERVICE CLASS
// ============================================

/**
 * Main RAG Service for AI-powered chat
 * Handles intent classification, context management, and response generation
 */
export class RAGService {
    /**
     * Initialize RAG Service with enhanced context management
     */
    constructor() {
        this.conversationManager = new EnhancedContextManager();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0
        };

        logger.info('RAG Service initialized', {
            contextManager: 'EnhancedContextManager',
            version: '2.0.0'
        });
    }

    // ============================================
    // MAIN CHAT METHOD
    // ============================================

    /**
     * Main chat handler - processes user messages and generates AI responses
     * 
     * @param {string} userId - Unique user identifier
     * @param {string} message - User's message
     * @param {Array<{role: string, content: string}>} conversationHistory - Previous messages
     * @returns {Promise<Object>} Response with intent, answer, and metadata
     * 
     * @throws {RAGError} If processing fails after error handling
     * 
     * @example
     * const response = await ragService.chat('user123', 'tìm áo polo màu đen', []);
     * console.log(response.intent); // 'product_advice'
     * console.log(response.answer); // Product recommendations...
     */
    async chat(userId, message, conversationHistory = []) {
        const requestId = generateRequestId();
        const startTime = Date.now();

        this.metrics.totalRequests++;

        logRequestStart(userId, message, requestId);

        try {
            // Validate inputs
            this._validateInputs(userId, message);

            // 1. Parallel: Classify intent + Get context + Build customer context
            const [intentResult, context, customerContext] = await Promise.all([
                this._classifyIntent(message, conversationHistory, requestId),
                this._getContext(userId, message, conversationHistory, requestId),
                this._buildCustomerContext(userId, requestId)
            ]);

            const { intent, confidence, extracted_info } = intentResult;

            logger.info('Processing request', {
                requestId,
                intent,
                confidence: confidence.toFixed(2),
                hasContext: context.has_entities,
                customerType: customerContext.userProfile?.customerType
            });

            // 2. Build enriched context
            const enrichedContext = {
                ...context,
                customerContext: customerContext.contextString,
                customerProfile: customerContext.userProfile,
                hasCustomerContext: customerContext.hasContext,
                requestId
            };

            // 3. Route to appropriate service
            const result = await this._routeToService(
                intent,
                message,
                extracted_info,
                enrichedContext,
                customerContext,
                userId,
                requestId
            );

            // 4. Save to conversation history (non-blocking)
            this._saveConversation(userId, message, intent, result).catch(err => {
                logWarning('Failed to save conversation', {
                    userId,
                    error: err.message,
                    requestId
                });
            });

            // 5. Log analytics (non-blocking)
            this._logAnalytics(userId, context, intent, customerContext, result, startTime)
                .catch(err => {
                    logWarning('Analytics logging failed', {
                        error: err.message,
                        requestId
                    });
                });

            // 6. Update metrics
            const responseTime = Date.now() - startTime;
            this._updateMetrics(responseTime, true);

            logRequestComplete(requestId, intent, confidence, responseTime);

            return {
                intent,
                confidence,
                ...result,
                conversation_id: context.conversation_id,
                requestId
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this._updateMetrics(responseTime, false);

            logError('RAGService.chat', error, {
                userId,
                messagePreview: message?.substring(0, 50),
                requestId
            });

            // Handle gracefully
            return this._handleError(error, requestId);
        }
    }

    // ============================================
    // PRIVATE METHODS - CORE PROCESSING
    // ============================================

    /**
     * Validate input parameters
     * @private
     */
    _validateInputs(userId, message) {
        if (!userId) {
            throw new RAGError('User ID is required', 'INVALID_INPUT', 400);
        }
        if (!message || typeof message !== 'string') {
            throw new RAGError('Message must be a non-empty string', 'INVALID_INPUT', 400);
        }
        if (message.length > 5000) {
            throw new RAGError('Message exceeds maximum length', 'MESSAGE_TOO_LONG', 400);
        }
    }

    /**
     * Classify user intent with error handling
     * @private
     */
    async _classifyIntent(message, conversationHistory, requestId) {
        try {
            return await hybridClassifyIntent(message, conversationHistory);
        } catch (error) {
            logError('Intent classification failed', error, { requestId });
            // Return fallback intent
            return {
                intent: 'general',
                confidence: 0,
                extracted_info: {}
            };
        }
    }

    /**
     * Get conversation context with error handling
     * 🆕 Now includes current message for topic change detection
     * @private
     */
    async _getContext(userId, currentMessage, conversationHistory, requestId) {
        try {
            return await this.conversationManager.getContext(userId, currentMessage, conversationHistory);
        } catch (error) {
            logError('Context retrieval failed', error, { userId, requestId });
            // Return minimal context
            return {
                conversation_id: `fallback_${userId}_${Date.now()}`,
                history: conversationHistory,
                recent_messages: conversationHistory.slice(-5),
                has_entities: false,
                topic_changed: false
            };
        }
    }

    /**
     * Build customer context with error handling
     * @private
     */
    async _buildCustomerContext(userId, requestId) {
        try {
            return await buildCustomerContext(userId);
        } catch (error) {
            logError('Customer context build failed', error, { userId, requestId });
            return {
                hasContext: false,
                contextString: '',
                userProfile: null
            };
        }
    }

    /**
     * Route request to appropriate service
     * @private
     */
    async _routeToService(intent, message, extractedInfo, context, customerContext, userId, requestId) {
        switch (intent) {
            case 'product_advice':
                return await productAdvice(message, context);

            case 'size_recommendation':
                return await sizeRecommendation(message, extractedInfo, context);

            case 'style_matching':
                return await styleMatcher(message, context);

            case 'order_lookup':
                return await orderLookup(message, extractedInfo, userId);

            case 'policy_faq':
                return await policyFAQ(message, extractedInfo);

            case 'add_to_cart':
                return await handleAddToCart(message, extractedInfo, context);

            case 'admin_analytics':
                // Verify admin role
                if (customerContext.userProfile?.role !== 'admin') {
                    logger.warn('Unauthorized admin analytics attempt', {
                        userId,
                        requestId
                    });
                    return {
                        answer: 'Xin lỗi, bạn không có quyền truy cập chức năng này.',
                        intent: 'unauthorized'
                    };
                }
                return await adminAnalytics(message, extractedInfo, context);

            default:
                return this._getDefaultResponse(customerContext);
        }
    }

    /**
     * Get default response based on user type
     * @private
     */
    _getDefaultResponse(customerContext) {
        if (customerContext.userProfile?.role === 'admin') {
            return {
                answer: DEFAULT_ADMIN_MESSAGE,
                intent: 'general_admin'
            };
        }

        return {
            answer: DEFAULT_USER_MESSAGE,
            intent: 'general'
        };
    }

    /**
     * Save conversation to history
     * @private
     */
    async _saveConversation(userId, message, intent, result) {
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
    }

    /**
     * Log analytics data
     * @private
     */
    async _logAnalytics(userId, context, intent, customerContext, result, startTime) {
        const responseTime = Date.now() - startTime;

        await chatbotAnalyticsService.logChatInteraction({
            userId,
            sessionId: context.conversation_id,
            intent,
            hasPersonalization: customerContext.hasContext,
            customerType: customerContext.userProfile?.customerType,
            engagementScore: customerContext.intelligence?.engagementScore,
            responseTime,
            productsShown: result.suggested_products?.length || 0
        });
    }

    /**
     * Handle errors gracefully
     * @private
     */
    _handleError(error, requestId) {
        const ragError = wrapError(error, 'RAGService.chat');
        const userMessage = getUserFriendlyMessage(ragError);

        return {
            intent: 'error',
            confidence: 0,
            answer: userMessage,
            error: {
                code: ragError.code,
                requestId
            },
            requestId
        };
    }

    /**
     * Update performance metrics
     * @private
     */
    _updateMetrics(responseTime, success) {
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }

        // Update rolling average
        const totalSuccessful = this.metrics.successfulRequests;
        if (success && totalSuccessful > 0) {
            this.metrics.avgResponseTime =
                (this.metrics.avgResponseTime * (totalSuccessful - 1) + responseTime) / totalSuccessful;
        }
    }

    // ============================================
    // PUBLIC API METHODS
    // ============================================

    /**
     * Get conversation history for a user
     * 
     * @param {string} userId - User identifier
     * @param {number} [limit=20] - Maximum messages to return
     * @returns {Promise<Array>} Conversation history
     */
    async getHistory(userId, limit = 20) {
        try {
            return await this.conversationManager.getHistory(userId, limit);
        } catch (error) {
            logError('getHistory', error, { userId });
            return [];
        }
    }

    /**
     * Clear conversation context for a user
     * 
     * @param {string} userId - User identifier
     * @returns {Promise<boolean>} Success status
     */
    async clearContext(userId) {
        try {
            await this.conversationManager.clearContext(userId);
            logger.info('Context cleared', { userId });
            return true;
        } catch (error) {
            logError('clearContext', error, { userId });
            return false;
        }
    }

    /**
     * Get service health and metrics
     * 
     * @returns {Object} Health status and metrics
     */
    getHealth() {
        return {
            status: 'healthy',
            version: '2.0.0',
            metrics: {
                ...this.metrics,
                successRate: this.metrics.totalRequests > 0
                    ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
                    : 'N/A',
                avgResponseTimeMs: Math.round(this.metrics.avgResponseTime)
            },
            conversationManager: {
                cacheStats: this.conversationManager.getCacheStats?.() || {}
            }
        };
    }

    /**
     * Reset service metrics (admin only)
     */
    resetMetrics() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            avgResponseTime: 0
        };
        logger.info('Service metrics reset');
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const ragService = new RAGService();
