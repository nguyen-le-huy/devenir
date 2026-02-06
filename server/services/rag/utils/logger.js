/**
 * Structured Logger for RAG Service
 * Enterprise-grade logging with Winston
 * 
 * @module Logger
 * @version 1.0.0
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory
const LOG_DIR = path.join(__dirname, '../../../../logs');

// Custom format for console output
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
);

// Custom format for file output (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
        service: 'rag-service',
        version: '1.0.0'
    },
    transports: []
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: path.join(LOG_DIR, 'rag-error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));

    logger.add(new winston.transports.File({
        filename: path.join(LOG_DIR, 'rag-combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10
    }));
}

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// ============================================
// SPECIALIZED LOGGING METHODS
// ============================================

/**
 * Log RAG request start
 * @param {string} userId - User ID
 * @param {string} message - User message
 * @param {string} requestId - Request tracking ID
 */
export function logRequestStart(userId, message, requestId) {
    logger.info('RAG request started', {
        userId,
        messageLength: message.length,
        messagePreview: message.substring(0, 50),
        requestId
    });
}

/**
 * Log RAG request completion
 * @param {string} requestId - Request tracking ID
 * @param {string} intent - Detected intent
 * @param {number} confidence - Intent confidence
 * @param {number} durationMs - Request duration in ms
 */
export function logRequestComplete(requestId, intent, confidence, durationMs) {
    logger.info('RAG request completed', {
        requestId,
        intent,
        confidence: confidence.toFixed(2),
        durationMs
    });
}

/**
 * Log intent classification
 * @param {string} intent - Classified intent
 * @param {number} confidence - Confidence score
 * @param {string} method - Classification method (keyword/llm)
 * @param {number} durationMs - Classification duration
 */
export function logIntentClassification(intent, confidence, method, durationMs) {
    logger.info('Intent classified', {
        intent,
        confidence: confidence.toFixed(2),
        method,
        durationMs
    });
}

/**
 * Log entity extraction
 * @param {string} userId - User ID
 * @param {Object} entities - Extracted entities
 * @param {number} durationMs - Extraction duration
 */
export function logEntityExtraction(userId, entities, durationMs) {
    logger.debug('Entities extracted', {
        userId,
        hasCurrentProduct: !!entities?.current_product,
        productCount: entities?.all_products?.length || 0,
        hasMeasurements: !!(entities?.user_measurements?.height || entities?.user_measurements?.weight),
        topic: entities?.conversation_topic,
        durationMs
    });
}

/**
 * Log vector search
 * @param {string} query - Search query
 * @param {number} resultCount - Number of results
 * @param {number} topScore - Highest score
 * @param {number} durationMs - Search duration
 */
export function logVectorSearch(query, resultCount, topScore, durationMs) {
    logger.info('Vector search completed', {
        queryPreview: query.substring(0, 30),
        resultCount,
        topScore: topScore?.toFixed(3),
        durationMs
    });
}

/**
 * Log LLM request
 * @param {string} operation - Operation type
 * @param {string} model - Model used
 * @param {number} promptTokens - Prompt tokens
 * @param {number} completionTokens - Completion tokens
 * @param {number} durationMs - Request duration
 */
export function logLLMRequest(operation, model, promptTokens, completionTokens, durationMs) {
    logger.info('LLM request completed', {
        operation,
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        durationMs
    });
}

/**
 * Log cache operation
 * @param {string} operation - Operation (get/set/delete)
 * @param {string} cacheType - Cache type
 * @param {boolean} hit - Whether cache was hit
 * @param {string} key - Cache key (sanitized)
 */
export function logCacheOperation(operation, cacheType, hit, key) {
    logger.debug('Cache operation', {
        operation,
        cacheType,
        hit,
        keyPrefix: key?.substring(0, 20)
    });
}

/**
 * Log product knowledge generation
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {Object} knowledge - Generated knowledge
 * @param {number} durationMs - Generation duration
 */
export function logProductKnowledge(productId, productName, knowledge, durationMs) {
    logger.debug('Product knowledge generated', {
        productId,
        productName,
        material: knowledge?.material,
        fitType: knowledge?.fitType,
        confidence: knowledge?.confidence?.toFixed(2),
        durationMs
    });
}

/**
 * Log size recommendation
 * @param {string} productId - Product ID
 * @param {string} recommendedSize - Recommended size
 * @param {number} confidence - Confidence score
 * @param {boolean} hasMeasurements - Whether user provided measurements
 */
export function logSizeRecommendation(productId, recommendedSize, confidence, hasMeasurements) {
    logger.info('Size recommendation generated', {
        productId,
        recommendedSize,
        confidence: confidence?.toFixed(2),
        hasMeasurements
    });
}

/**
 * Log admin analytics query
 * @param {string} userId - Admin user ID
 * @param {string} queryType - Analytics query type
 * @param {Object} params - Query parameters
 * @param {number} durationMs - Query duration
 */
export function logAdminQuery(userId, queryType, params, durationMs) {
    logger.info('Admin analytics query', {
        userId,
        queryType,
        period: params?.period,
        durationMs
    });
}

/**
 * Log error with context
 * @param {string} operation - Operation that failed
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(operation, error, context = {}) {
    logger.error(`${operation} failed`, {
        errorName: error.name,
        errorCode: error.code,
        errorMessage: error.message,
        ...context,
        stack: error.stack
    });
}

/**
 * Log warning
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
export function logWarning(message, context = {}) {
    logger.warn(message, context);
}

/**
 * Log performance metrics
 * @param {string} operation - Operation name
 * @param {Object} metrics - Performance metrics
 */
export function logPerformance(operation, metrics) {
    logger.info('Performance metrics', {
        operation,
        ...metrics
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique request ID
 * @returns {string} Request ID
 */
export function generateRequestId() {
    return `rag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a child logger with additional context
 * @param {Object} context - Context to add
 * @returns {winston.Logger} Child logger
 */
export function createContextLogger(context) {
    return logger.child(context);
}

// Export default logger for direct use
export default logger;
