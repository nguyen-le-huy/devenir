/**
 * Enhanced LLM Provider for RAG Service
 * Enterprise-grade wrapper with rate limiting, retry logic, and error handling
 * 
 * @module LLMProvider
 * @version 2.0.0
 */

import { openai, MODELS } from '../../../config/openai.js';
import {
    LLMProviderError,
    LLMRateLimitError,
    TimeoutError,
    wrapError
} from '../utils/errors.js';
import {
    logLLMRequest,
    logError,
    logWarning
} from '../utils/logger.js';

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // Per minute

// ============================================
// RATE LIMITER
// ============================================

class SimpleRateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }

    /**
     * Check if can make request
     * @returns {boolean}
     */
    canRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < this.windowMs);
        return this.requests.length < this.maxRequests;
    }

    /**
     * Record a request
     */
    recordRequest() {
        this.requests.push(Date.now());
    }

    /**
     * Get time until next available slot
     * @returns {number} Milliseconds to wait
     */
    getWaitTime() {
        if (this.canRequest()) return 0;
        const oldest = Math.min(...this.requests);
        return (oldest + this.windowMs) - Date.now();
    }
}

// ============================================
// LLM PROVIDER CLASS
// ============================================

/**
 * Enterprise-grade LLM Provider with rate limiting, retries, and observability
 */
export class LLMProvider {
    constructor() {
        this.client = openai;
        this.rateLimiter = new SimpleRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW);

        // Token usage tracking
        this.tokenUsage = {
            prompt: 0,
            completion: 0,
            requests: 0,
            lastReset: Date.now()
        };
    }

    // ============================================
    // MAIN API METHODS
    // ============================================

    /**
     * Generate chat completion with full error handling
     * 
     * @param {Array<{role: string, content: string}>} messages - Chat messages
     * @param {Object} options - Completion options
     * @param {string} [options.model] - Model to use
     * @param {number} [options.temperature] - Temperature (0-2)
     * @param {number} [options.maxTokens] - Max completion tokens
     * @param {Object} [options.responseFormat] - Response format
     * @param {number} [options.timeout] - Request timeout in ms
     * @param {number} [options.maxRetries] - Max retry attempts
     * @returns {Promise<string>} Completion content
     * 
     * @throws {LLMProviderError} If completion fails after retries
     * @throws {LLMRateLimitError} If rate limit is exceeded
     * @throws {TimeoutError} If request times out
     */
    async chatCompletion(messages, options = {}) {
        const {
            model = MODELS.CHAT,
            temperature = 0.3,
            maxTokens = 800,
            responseFormat = null,
            timeout = DEFAULT_TIMEOUT,
            maxRetries = DEFAULT_MAX_RETRIES
        } = options;

        const startTime = Date.now();

        // Rate limiting
        await this._waitForRateLimit();

        // Prepare request
        const completionOptions = {
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        };

        if (responseFormat) {
            completionOptions.response_format = responseFormat;
        }

        // Execute with retry logic
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this._executeWithTimeout(
                    () => this.client.chat.completions.create(completionOptions),
                    timeout
                );

                // Track usage
                if (response.usage) {
                    this._trackUsage(response.usage);
                }

                // Log success
                const duration = Date.now() - startTime;
                logLLMRequest(
                    'chatCompletion',
                    model,
                    response.usage?.prompt_tokens || 0,
                    response.usage?.completion_tokens || 0,
                    duration
                );

                return response.choices[0].message.content;

            } catch (error) {
                lastError = error;

                // Handle specific error types
                if (this._isRateLimitError(error)) {
                    const retryAfter = this._getRetryAfter(error);
                    throw new LLMRateLimitError(retryAfter);
                }

                if (this._isTimeoutError(error)) {
                    throw new TimeoutError('LLM completion', timeout);
                }

                // Retry for transient errors
                if (attempt < maxRetries && this._isRetryableError(error)) {
                    const delay = DEFAULT_RETRY_DELAY * Math.pow(2, attempt - 1);
                    logWarning(`LLM request failed, retrying in ${delay}ms`, {
                        attempt,
                        error: error.message
                    });
                    await this._sleep(delay);
                    continue;
                }
            }
        }

        // All retries exhausted
        logError('chatCompletion', lastError, { model, attempts: maxRetries });
        throw new LLMProviderError(
            `Chat completion failed after ${maxRetries} attempts: ${lastError?.message}`,
            { model, originalError: lastError?.message }
        );
    }

    /**
     * Generate JSON response with automatic parsing
     * 
     * @param {Array<{role: string, content: string}>} messages - Chat messages
     * @param {Object} options - Completion options
     * @returns {Promise<Object>} Parsed JSON response
     * 
     * @throws {LLMProviderError} If completion or parsing fails
     */
    async jsonCompletion(messages, options = {}) {
        try {
            const content = await this.chatCompletion(messages, {
                ...options,
                model: options.model || MODELS.CHAT_FAST,
                responseFormat: { type: 'json_object' }
            });

            return JSON.parse(content);

        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new LLMProviderError(
                    'Failed to parse LLM JSON response',
                    { parseError: error.message }
                );
            }
            throw error;
        }
    }

    /**
     * Fast completion for classification tasks
     * Uses faster model with lower temperature
     * 
     * @param {Array<{role: string, content: string}>} messages - Chat messages
     * @param {Object} options - Completion options
     * @returns {Promise<string>} Completion content
     */
    async fastCompletion(messages, options = {}) {
        return this.chatCompletion(messages, {
            ...options,
            model: MODELS.CHAT_FAST,
            temperature: 0.1,
            timeout: 15000 // Shorter timeout for fast completions
        });
    }

    /**
     * Generate embeddings for text
     * 
     * @param {string} text - Text to embed
     * @param {number} [dimensions=1536] - Embedding dimensions
     * @returns {Promise<number[]>} Embedding vector
     * 
     * @throws {LLMProviderError} If embedding fails
     */
    async embed(text, dimensions = 1536) {
        const startTime = Date.now();

        try {
            await this._waitForRateLimit();

            const response = await this._executeWithTimeout(
                () => this.client.embeddings.create({
                    model: MODELS.EMBEDDING,
                    input: text,
                    dimensions
                }),
                10000 // 10s timeout for embeddings
            );

            const duration = Date.now() - startTime;
            logLLMRequest(
                'embed',
                MODELS.EMBEDDING,
                response.usage?.prompt_tokens || 0,
                0,
                duration
            );

            return response.data[0].embedding;

        } catch (error) {
            logError('embed', error, { textLength: text?.length });
            throw new LLMProviderError(
                `Embedding generation failed: ${error.message}`,
                { textLength: text?.length }
            );
        }
    }

    /**
     * Generate batch embeddings
     * 
     * @param {string[]} texts - Texts to embed
     * @param {number} [dimensions=1536] - Embedding dimensions
     * @returns {Promise<number[][]>} Array of embedding vectors
     */
    async embedBatch(texts, dimensions = 1536) {
        const startTime = Date.now();

        try {
            await this._waitForRateLimit();

            const response = await this._executeWithTimeout(
                () => this.client.embeddings.create({
                    model: MODELS.EMBEDDING,
                    input: texts,
                    dimensions
                }),
                30000 // 30s timeout for batch
            );

            const duration = Date.now() - startTime;
            logLLMRequest(
                'embedBatch',
                MODELS.EMBEDDING,
                response.usage?.prompt_tokens || 0,
                0,
                duration
            );

            return response.data.map(item => item.embedding);

        } catch (error) {
            logError('embedBatch', error, { batchSize: texts?.length });
            throw new LLMProviderError(
                `Batch embedding failed: ${error.message}`,
                { batchSize: texts?.length }
            );
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    /**
     * Wait for rate limit to allow request
     * @private
     */
    async _waitForRateLimit() {
        if (!this.rateLimiter.canRequest()) {
            const waitTime = this.rateLimiter.getWaitTime();
            logWarning('Rate limit reached, waiting', { waitMs: waitTime });
            await this._sleep(waitTime);
        }
        this.rateLimiter.recordRequest();
    }

    /**
     * Execute function with timeout
     * @private
     */
    async _executeWithTimeout(fn, timeout) {
        return Promise.race([
            fn(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), timeout)
            )
        ]);
    }

    /**
     * Sleep for specified milliseconds
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Track token usage
     * @private
     */
    _trackUsage(usage) {
        this.tokenUsage.prompt += usage.prompt_tokens || 0;
        this.tokenUsage.completion += usage.completion_tokens || 0;
        this.tokenUsage.requests += 1;
    }

    /**
     * Check if error is a rate limit error
     * @private
     */
    _isRateLimitError(error) {
        return error?.status === 429 ||
            error?.code === 'rate_limit_exceeded' ||
            error?.message?.toLowerCase().includes('rate limit');
    }

    /**
     * Check if error is a timeout error
     * @private
     */
    _isTimeoutError(error) {
        return error?.message === 'TIMEOUT' ||
            error?.code === 'ETIMEDOUT' ||
            error?.code === 'ECONNABORTED';
    }

    /**
     * Check if error is retryable
     * @private
     */
    _isRetryableError(error) {
        const retryableStatuses = [500, 502, 503, 504];
        const retryableCodes = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];

        return retryableStatuses.includes(error?.status) ||
            retryableCodes.includes(error?.code) ||
            error?.message?.includes('network') ||
            error?.message?.includes('timeout');
    }

    /**
     * Get retry-after value from error
     * @private
     */
    _getRetryAfter(error) {
        const header = error?.headers?.['retry-after'];
        return header ? parseInt(header) * 1000 : 60000;
    }

    // ============================================
    // OBSERVABILITY
    // ============================================

    /**
     * Get current token usage statistics
     * @returns {Object} Token usage stats
     */
    getUsageStats() {
        const hoursSinceReset = (Date.now() - this.tokenUsage.lastReset) / 3600000;

        return {
            ...this.tokenUsage,
            totalTokens: this.tokenUsage.prompt + this.tokenUsage.completion,
            hoursSinceReset: hoursSinceReset.toFixed(2),
            avgTokensPerRequest: this.tokenUsage.requests > 0
                ? Math.round((this.tokenUsage.prompt + this.tokenUsage.completion) / this.tokenUsage.requests)
                : 0
        };
    }

    /**
     * Reset usage statistics
     */
    resetUsageStats() {
        this.tokenUsage = {
            prompt: 0,
            completion: 0,
            requests: 0,
            lastReset: Date.now()
        };
    }

    /**
     * Get rate limiter status
     * @returns {Object} Rate limiter status
     */
    getRateLimiterStatus() {
        return {
            canRequest: this.rateLimiter.canRequest(),
            currentRequests: this.rateLimiter.requests.length,
            maxRequests: this.rateLimiter.maxRequests,
            waitTime: this.rateLimiter.getWaitTime()
        };
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const llmProvider = new LLMProvider();
