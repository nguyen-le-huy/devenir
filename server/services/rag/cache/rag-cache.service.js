/**
 * RAG Cache Service
 * Enterprise-grade caching layer with Redis and in-memory fallback
 * 
 * @module RAGCache
 * @version 1.0.0
 */

import { createClient } from 'redis';
import crypto from 'crypto';
import logger, { logCacheOperation, logError, logWarning } from '../utils/logger.js';
import { CacheError } from '../utils/errors.js';
import { RAG_CONFIG } from '../constants.js';

// ============================================
// CONFIGURATION
// ============================================

const CACHE_TTL = RAG_CONFIG.CACHE || {
    INTENT_TTL: 300,
    VECTOR_TTL: 3600,
    KNOWLEDGE_TTL: 1800,
    COLOR_TTL: 3600
};

// ============================================
// IN-MEMORY FALLBACK CACHE
// ============================================

class InMemoryCache {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    async get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return entry.value;
    }

    async set(key, value, ttlSeconds = 300) {
        // LRU eviction if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    }

    async del(key) {
        return this.cache.delete(key);
    }

    async flush() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : 'N/A'
        };
    }
}

// ============================================
// RAG CACHE CLASS
// ============================================

/**
 * Enterprise RAG Cache with Redis support and in-memory fallback
 */
export class RAGCache {
    constructor() {
        this.redis = null;
        this.fallback = new InMemoryCache();
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;

        // Cache type prefixes
        this.prefixes = {
            intent: 'rag:intent:',
            vector: 'rag:vector:',
            knowledge: 'rag:knowledge:',
            context: 'rag:context:',
            color: 'rag:color:'
        };

        // Stats tracking
        this.stats = {
            intent: { hits: 0, misses: 0 },
            vector: { hits: 0, misses: 0 },
            knowledge: { hits: 0, misses: 0 }
        };
    }

    /**
     * Initialize Redis connection
     * @returns {Promise<boolean>} Connection status
     */
    async connect() {
        if (this.isConnected) {
            return true;
        }

        // Skip Redis if not configured
        if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
            logger.info('Redis not configured, using in-memory cache');
            return false;
        }

        try {
            this.connectionAttempts++;

            const redisConfig = {
                url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
                password: process.env.REDIS_PASSWORD || undefined,
                socket: {
                    connectTimeout: 5000,
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            return new Error('Max retries reached');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            };

            this.redis = createClient(redisConfig);

            this.redis.on('error', (err) => {
                logWarning('Redis connection error', { error: err.message });
            });

            this.redis.on('connect', () => {
                logger.info('Redis connected successfully');
            });

            await this.redis.connect();
            this.isConnected = true;

            logger.info('RAG Cache initialized with Redis');
            return true;

        } catch (error) {
            logWarning('Failed to connect to Redis, using in-memory cache', {
                error: error.message,
                attempt: this.connectionAttempts
            });
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Get cache instance (Redis or fallback)
     * @private
     */
    _getCache() {
        return this.isConnected && this.redis ? this.redis : this.fallback;
    }

    /**
     * Generate cache key hash
     * @private
     */
    _hashKey(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    // ============================================
    // INTENT CACHING
    // ============================================

    /**
     * Get cached intent classification
     * @param {string} message - User message
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Cached intent result or null
     */
    async getIntent(message, userId) {
        const key = `${this.prefixes.intent}${userId}:${this._hashKey(message)}`;

        try {
            const cache = this._getCache();
            const cached = await cache.get(key);

            if (cached) {
                this.stats.intent.hits++;
                logCacheOperation('get', 'intent', true, key);
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }

            this.stats.intent.misses++;
            logCacheOperation('get', 'intent', false, key);
            return null;

        } catch (error) {
            logError('Cache getIntent failed', error, { key });
            return null;
        }
    }

    /**
     * Cache intent classification result
     * @param {string} message - User message
     * @param {string} userId - User ID
     * @param {Object} result - Intent result to cache
     * @param {number} ttl - TTL in seconds
     */
    async setIntent(message, userId, result, ttl = CACHE_TTL.INTENT_TTL) {
        const key = `${this.prefixes.intent}${userId}:${this._hashKey(message)}`;

        try {
            const cache = this._getCache();
            const value = JSON.stringify(result);

            if (this.isConnected && this.redis) {
                await cache.setEx(key, ttl, value);
            } else {
                await cache.set(key, result, ttl);
            }

            logCacheOperation('set', 'intent', true, key);

        } catch (error) {
            logError('Cache setIntent failed', error, { key });
        }
    }

    // ============================================
    // VECTOR SEARCH CACHING
    // ============================================

    /**
     * Get cached vector search results
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array|null>} Cached results or null
     */
    async getVectorSearch(query, options = {}) {
        const optionsHash = this._hashKey(JSON.stringify(options));
        const key = `${this.prefixes.vector}${this._hashKey(query)}:${optionsHash}`;

        try {
            const cache = this._getCache();
            const cached = await cache.get(key);

            if (cached) {
                this.stats.vector.hits++;
                logCacheOperation('get', 'vector', true, key);
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }

            this.stats.vector.misses++;
            logCacheOperation('get', 'vector', false, key);
            return null;

        } catch (error) {
            logError('Cache getVectorSearch failed', error, { key });
            return null;
        }
    }

    /**
     * Cache vector search results
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {Array} results - Search results to cache
     * @param {number} ttl - TTL in seconds
     */
    async setVectorSearch(query, options = {}, results, ttl = CACHE_TTL.VECTOR_TTL) {
        const optionsHash = this._hashKey(JSON.stringify(options));
        const key = `${this.prefixes.vector}${this._hashKey(query)}:${optionsHash}`;

        try {
            const cache = this._getCache();
            const value = JSON.stringify(results);

            if (this.isConnected && this.redis) {
                await cache.setEx(key, ttl, value);
            } else {
                await cache.set(key, results, ttl);
            }

            logCacheOperation('set', 'vector', true, key);

        } catch (error) {
            logError('Cache setVectorSearch failed', error, { key });
        }
    }

    // ============================================
    // PRODUCT KNOWLEDGE CACHING
    // ============================================

    /**
     * Get cached product knowledge
     * @param {string} productId - Product ID
     * @returns {Promise<Object|null>} Cached knowledge or null
     */
    async getProductKnowledge(productId) {
        const key = `${this.prefixes.knowledge}${productId}`;

        try {
            const cache = this._getCache();
            const cached = await cache.get(key);

            if (cached) {
                this.stats.knowledge.hits++;
                logCacheOperation('get', 'knowledge', true, key);
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }

            this.stats.knowledge.misses++;
            logCacheOperation('get', 'knowledge', false, key);
            return null;

        } catch (error) {
            logError('Cache getProductKnowledge failed', error, { productId });
            return null;
        }
    }

    /**
     * Cache product knowledge
     * @param {string} productId - Product ID
     * @param {Object} knowledge - Product knowledge to cache
     * @param {number} ttl - TTL in seconds
     */
    async setProductKnowledge(productId, knowledge, ttl = CACHE_TTL.KNOWLEDGE_TTL) {
        const key = `${this.prefixes.knowledge}${productId}`;

        try {
            const cache = this._getCache();
            const value = JSON.stringify(knowledge);

            if (this.isConnected && this.redis) {
                await cache.setEx(key, ttl, value);
            } else {
                await cache.set(key, knowledge, ttl);
            }

            logCacheOperation('set', 'knowledge', true, key);

        } catch (error) {
            logError('Cache setProductKnowledge failed', error, { productId });
        }
    }

    // ============================================
    // CONTEXT CACHING
    // ============================================

    /**
     * Get cached user context
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Cached context or null
     */
    async getContext(userId) {
        const key = `${this.prefixes.context}${userId}`;

        try {
            const cache = this._getCache();
            const cached = await cache.get(key);

            if (cached) {
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }

            return null;

        } catch (error) {
            logError('Cache getContext failed', error, { userId });
            return null;
        }
    }

    /**
     * Cache user context
     * @param {string} userId - User ID
     * @param {Object} context - Context to cache
     * @param {number} ttl - TTL in seconds (default 30 min)
     */
    async setContext(userId, context, ttl = 1800) {
        const key = `${this.prefixes.context}${userId}`;

        try {
            const cache = this._getCache();
            const value = JSON.stringify(context);

            if (this.isConnected && this.redis) {
                await cache.setEx(key, ttl, value);
            } else {
                await cache.set(key, context, ttl);
            }

        } catch (error) {
            logError('Cache setContext failed', error, { userId });
        }
    }

    /**
     * Delete user context
     * @param {string} userId - User ID
     */
    async deleteContext(userId) {
        const key = `${this.prefixes.context}${userId}`;

        try {
            const cache = this._getCache();
            await cache.del(key);
        } catch (error) {
            logError('Cache deleteContext failed', error, { userId });
        }
    }

    // ============================================
    // GENERIC METHODS
    // ============================================

    /**
     * Get any cached value by key
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value or null
     */
    async get(key) {
        try {
            const cache = this._getCache();
            const cached = await cache.get(key);

            if (cached && typeof cached === 'string') {
                try {
                    return JSON.parse(cached);
                } catch {
                    return cached;
                }
            }

            return cached;
        } catch (error) {
            return null;
        }
    }

    /**
     * Set any value by key
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - TTL in seconds
     */
    async set(key, value, ttl = 300) {
        try {
            const cache = this._getCache();
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);

            if (this.isConnected && this.redis) {
                await cache.setEx(key, ttl, serialized);
            } else {
                await cache.set(key, value, ttl);
            }
        } catch (error) {
            logError('Cache set failed', error, { key });
        }
    }

    /**
     * Delete a cached value
     * @param {string} key - Cache key
     */
    async del(key) {
        try {
            const cache = this._getCache();
            await cache.del(key);
        } catch (error) {
            logError('Cache del failed', error, { key });
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Flush all caches
     */
    async flush() {
        try {
            if (this.isConnected && this.redis) {
                await this.redis.flushDb();
            }
            await this.fallback.flush();

            // Reset stats
            this.stats = {
                intent: { hits: 0, misses: 0 },
                vector: { hits: 0, misses: 0 },
                knowledge: { hits: 0, misses: 0 }
            };

            logger.info('RAG cache flushed');
        } catch (error) {
            logError('Cache flush failed', error);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        const calculateHitRate = (stats) => {
            const total = stats.hits + stats.misses;
            return total > 0 ? (stats.hits / total * 100).toFixed(2) + '%' : 'N/A';
        };

        return {
            backend: this.isConnected ? 'redis' : 'memory',
            isConnected: this.isConnected,
            intent: {
                ...this.stats.intent,
                hitRate: calculateHitRate(this.stats.intent)
            },
            vector: {
                ...this.stats.vector,
                hitRate: calculateHitRate(this.stats.vector)
            },
            knowledge: {
                ...this.stats.knowledge,
                hitRate: calculateHitRate(this.stats.knowledge)
            },
            fallback: this.fallback.getStats()
        };
    }

    /**
     * Health check
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        const status = {
            healthy: true,
            backend: this.isConnected ? 'redis' : 'memory',
            latency: null
        };

        if (this.isConnected && this.redis) {
            try {
                const start = Date.now();
                await this.redis.ping();
                status.latency = Date.now() - start;
            } catch (error) {
                status.healthy = false;
                status.error = error.message;
            }
        }

        return status;
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
            this.isConnected = false;
            logger.info('RAG cache disconnected');
        }
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const ragCache = new RAGCache();

// Auto-connect on first import (non-blocking)
ragCache.connect().catch(() => {
    // Silently fall back to in-memory
});
