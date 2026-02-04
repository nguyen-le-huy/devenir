/**
 * RAG Service Error Classes
 * Enterprise-grade error handling with proper types and context
 * 
 * @module RAGErrors
 * @version 1.0.0
 */

/**
 * Base error class for all RAG-related errors
 */
export class RAGError extends Error {
    /**
     * @param {string} message - Human-readable error message
     * @param {string} code - Machine-readable error code
     * @param {number} statusCode - HTTP status code for API responses
     * @param {Object} details - Additional context for debugging
     */
    constructor(message, code, statusCode = 500, details = null) {
        super(message);
        this.name = 'RAGError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Serialize error for logging
     * @returns {Object} Serialized error object
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            timestamp: this.timestamp,
            stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
        };
    }
}

/**
 * Error thrown when intent classification fails
 */
export class IntentClassificationError extends RAGError {
    constructor(message, details = null) {
        super(
            message || 'Failed to classify user intent',
            'INTENT_CLASSIFICATION_FAILED',
            500,
            details
        );
        this.name = 'IntentClassificationError';
    }
}

/**
 * Error thrown when a product cannot be found
 */
export class ProductNotFoundError extends RAGError {
    constructor(identifier, searchType = 'id') {
        super(
            `Product not found: ${identifier}`,
            'PRODUCT_NOT_FOUND',
            404,
            { identifier, searchType }
        );
        this.name = 'ProductNotFoundError';
    }
}

/**
 * Error thrown when vector search fails
 */
export class VectorSearchError extends RAGError {
    constructor(message, details = null) {
        super(
            message || 'Vector search operation failed',
            'VECTOR_SEARCH_FAILED',
            500,
            details
        );
        this.name = 'VectorSearchError';
    }
}

/**
 * Error thrown when LLM provider call fails
 */
export class LLMProviderError extends RAGError {
    constructor(message, details = null) {
        super(
            message || 'LLM provider request failed',
            'LLM_PROVIDER_FAILED',
            503,
            details
        );
        this.name = 'LLMProviderError';
    }
}

/**
 * Error thrown when LLM rate limit is exceeded
 */
export class LLMRateLimitError extends RAGError {
    constructor(retryAfter = null) {
        super(
            'LLM rate limit exceeded. Please retry later.',
            'LLM_RATE_LIMIT_EXCEEDED',
            429,
            { retryAfter }
        );
        this.name = 'LLMRateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Error thrown when entity extraction fails
 */
export class EntityExtractionError extends RAGError {
    constructor(message, details = null) {
        super(
            message || 'Failed to extract entities from conversation',
            'ENTITY_EXTRACTION_FAILED',
            500,
            details
        );
        this.name = 'EntityExtractionError';
    }
}

/**
 * Error thrown when context retrieval fails
 */
export class ContextRetrievalError extends RAGError {
    constructor(userId, details = null) {
        super(
            `Failed to retrieve context for user: ${userId}`,
            'CONTEXT_RETRIEVAL_FAILED',
            500,
            { userId, ...details }
        );
        this.name = 'ContextRetrievalError';
    }
}

/**
 * Error thrown when response generation fails
 */
export class ResponseGenerationError extends RAGError {
    constructor(intent, details = null) {
        super(
            `Failed to generate response for intent: ${intent}`,
            'RESPONSE_GENERATION_FAILED',
            500,
            { intent, ...details }
        );
        this.name = 'ResponseGenerationError';
    }
}

/**
 * Error thrown when admin analytics query fails
 */
export class AdminAnalyticsError extends RAGError {
    constructor(queryType, details = null) {
        super(
            `Admin analytics query failed: ${queryType}`,
            'ADMIN_ANALYTICS_FAILED',
            500,
            { queryType, ...details }
        );
        this.name = 'AdminAnalyticsError';
    }
}

/**
 * Error thrown when user is not authorized for an action
 */
export class UnauthorizedError extends RAGError {
    constructor(action, userId = null) {
        super(
            `Unauthorized to perform action: ${action}`,
            'UNAUTHORIZED',
            403,
            { action, userId }
        );
        this.name = 'UnauthorizedError';
    }
}

/**
 * Error thrown when cache operation fails
 */
export class CacheError extends RAGError {
    constructor(operation, key, details = null) {
        super(
            `Cache ${operation} failed for key: ${key}`,
            'CACHE_OPERATION_FAILED',
            500,
            { operation, key, ...details }
        );
        this.name = 'CacheError';
    }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends RAGError {
    constructor(field, reason, value = undefined) {
        super(
            `Validation failed for ${field}: ${reason}`,
            'VALIDATION_FAILED',
            400,
            { field, reason, value: value !== undefined ? value : '[hidden]' }
        );
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when product knowledge generation fails
 */
export class ProductKnowledgeError extends RAGError {
    constructor(productId, details = null) {
        super(
            `Failed to generate knowledge for product: ${productId}`,
            'PRODUCT_KNOWLEDGE_FAILED',
            500,
            { productId, ...details }
        );
        this.name = 'ProductKnowledgeError';
    }
}

/**
 * Error thrown when size recommendation fails
 */
export class SizeRecommendationError extends RAGError {
    constructor(reason, details = null) {
        super(
            `Size recommendation failed: ${reason}`,
            'SIZE_RECOMMENDATION_FAILED',
            500,
            details
        );
        this.name = 'SizeRecommendationError';
    }
}

/**
 * Error thrown when conversation persistence fails
 */
export class ConversationPersistenceError extends RAGError {
    constructor(operation, userId, details = null) {
        super(
            `Conversation ${operation} failed for user: ${userId}`,
            'CONVERSATION_PERSISTENCE_FAILED',
            500,
            { operation, userId, ...details }
        );
        this.name = 'ConversationPersistenceError';
    }
}

/**
 * Error thrown when embedding generation fails
 */
export class EmbeddingError extends RAGError {
    constructor(message, details = null) {
        super(
            message || 'Failed to generate embeddings',
            'EMBEDDING_FAILED',
            500,
            details
        );
        this.name = 'EmbeddingError';
    }
}

/**
 * Error thrown for timeout conditions
 */
export class TimeoutError extends RAGError {
    constructor(operation, timeout) {
        super(
            `Operation timed out after ${timeout}ms: ${operation}`,
            'TIMEOUT',
            504,
            { operation, timeout }
        );
        this.name = 'TimeoutError';
    }
}

/**
 * Check if an error is a RAGError
 * @param {Error} error - Error to check
 * @returns {boolean}
 */
export function isRAGError(error) {
    return error instanceof RAGError;
}

/**
 * Wrap unknown errors as RAGError
 * @param {Error|unknown} error - Error to wrap
 * @param {string} context - Context where error occurred
 * @returns {RAGError}
 */
export function wrapError(error, context = 'unknown') {
    if (error instanceof RAGError) {
        return error;
    }

    return new RAGError(
        error instanceof Error ? error.message : String(error),
        'UNKNOWN_ERROR',
        500,
        {
            originalError: error instanceof Error ? error.name : typeof error,
            context,
            stack: error instanceof Error ? error.stack : undefined
        }
    );
}

/**
 * Create user-friendly error message
 * @param {RAGError} error - RAG error
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error) {
    if (!isRAGError(error)) {
        return 'Xin lỗi, đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.';
    }

    const messages = {
        'INTENT_CLASSIFICATION_FAILED': 'Xin lỗi, mình chưa hiểu ý bạn. Bạn có thể diễn đạt lại được không?',
        'PRODUCT_NOT_FOUND': 'Xin lỗi, mình không tìm thấy sản phẩm này. Bạn có thể mô tả rõ hơn không?',
        'VECTOR_SEARCH_FAILED': 'Xin lỗi, hệ thống tìm kiếm đang gặp sự cố. Vui lòng thử lại sau.',
        'LLM_PROVIDER_FAILED': 'Xin lỗi, dịch vụ AI đang bận. Vui lòng thử lại sau ít phút.',
        'LLM_RATE_LIMIT_EXCEEDED': 'Hệ thống đang quá tải. Vui lòng đợi một chút rồi thử lại.',
        'UNAUTHORIZED': 'Bạn không có quyền thực hiện thao tác này.',
        'VALIDATION_FAILED': 'Thông tin bạn cung cấp chưa hợp lệ. Vui lòng kiểm tra lại.',
        'SIZE_RECOMMENDATION_FAILED': 'Xin lỗi, mình chưa thể tư vấn size. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
        'TIMEOUT': 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
        'UNKNOWN_ERROR': 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.'
    };

    return messages[error.code] || messages['UNKNOWN_ERROR'];
}
