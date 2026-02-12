/**
 * Semantic Cache Service
 * Cache query results by semantic similarity to reduce retrieval latency
 * 
 * @module SemanticCache
 * @version 3.0.0
 */

import { createClient } from 'redis';
import { llmProvider } from '../core/LLMProvider.js';
import logger, { logCacheOperation, logError, logWarning } from '../utils/logger.js';

class SemanticCache {
    constructor() {
        this.client = null;
        this.enabled = process.env.ENABLE_SEMANTIC_CACHE === 'true';
        this.ttl = parseInt(process.env.SEMANTIC_CACHE_TTL_HOURS || '6') * 3600;
        this.similarityThreshold = 0.95;
        this.cachePrefix = 'rag:semantic:query:';

        // Performance tracking
        this.stats = {
            hits: 0,
            misses: 0,
            errors: 0
        };
    }

    /**
     * Initialize Redis connection
     * @returns {Promise<boolean>} Connection status
     */
    async connect() {
        if (!this.enabled) {
            logger.info('Semantic cache disabled via feature flag');
            return false;
        }

        if (this.client) {
            return true; // Already connected
        }

        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            this.client = createClient({ url: redisUrl });

            this.client.on('error', (err) => {
                logWarning('Semantic cache Redis error', { error: err.message });
            });

            await this.client.connect();
            logger.info('Semantic cache connected to Redis', { ttl: this.ttl });
            return true;
        } catch (error) {
            logError('Semantic cache connection failed', error);
            this.enabled = false;
            return false;
        }
    }

    /**
     * Get cached results for a query
     * @param {string} query - User query
     * @returns {Promise<Object|null>} Cached results or null
     */
    async getCachedResults(query) {
        if (!this.enabled || !this.client) {
            return null;
        }

        try {
            const startTime = Date.now();
            const queryEmbedding = await llmProvider.embed(query);

            // Search for similar cached queries
            const similarQueries = await this.findSimilarQueries(queryEmbedding);

            if (similarQueries.length > 0) {
                const bestMatch = similarQueries[0];

                if (bestMatch.similarity >= this.similarityThreshold) {
                    this.stats.hits++;
                    const latency = Date.now() - startTime;

                    logCacheOperation('get', 'semantic', true, query.substring(0, 50), {
                        similarity: bestMatch.similarity.toFixed(3),
                        latency
                    });

                    return bestMatch.results;
                }
            }

            this.stats.misses++;
            logCacheOperation('get', 'semantic', false, query.substring(0, 50));
            return null;

        } catch (error) {
            this.stats.errors++;
            logError('Semantic cache retrieval failed', error, { query: query.substring(0, 50) });
            return null; // Graceful degradation
        }
    }

    /**
     * Cache query results
     * @param {string} query - User query
     * @param {Object} results - Results to cache
     * @returns {Promise<void>}
     */
    async cacheResults(query, results) {
        if (!this.enabled || !this.client) {
            return;
        }

        try {
            const queryEmbedding = await llmProvider.embed(query);
            const cacheKey = `${this.cachePrefix}${this.hashEmbedding(queryEmbedding)}`;

            const cacheData = {
                query,
                embedding: queryEmbedding,
                results,
                timestamp: Date.now()
            };

            await this.client.setEx(
                cacheKey,
                this.ttl,
                JSON.stringify(cacheData)
            );

            logCacheOperation('set', 'semantic', true, query.substring(0, 50));

        } catch (error) {
            this.stats.errors++;
            logError('Semantic cache storage failed', error, { query: query.substring(0, 50) });
        }
    }

    /**
     * Find similar queries using cosine similarity
     * @private
     * @param {number[]} queryEmbedding - Query embedding vector
     * @returns {Promise<Array>} Similar queries with similarity scores
     */
    async findSimilarQueries(queryEmbedding) {
        try {
            const keys = await this.client.keys(`${this.cachePrefix}*`);
            const similarities = [];

            // Limit to 100 most recent for performance
            const keysToCheck = keys.slice(0, 100);

            for (const key of keysToCheck) {
                const cached = await this.client.get(key);
                if (!cached) continue;

                const { query, embedding, results } = JSON.parse(cached);
                const similarity = this.cosineSimilarity(queryEmbedding, embedding);

                // Only consider if similarity is close to threshold
                if (similarity >= this.similarityThreshold - 0.05) {
                    similarities.push({ query, results, similarity });
                }
            }

            // Sort by similarity descending
            return similarities.sort((a, b) => b.similarity - a.similarity);

        } catch (error) {
            logError('Similar query search failed', error);
            return [];
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     * @private
     * @param {number[]} vecA - First vector
     * @param {number[]} vecB - Second vector
     * @returns {number} Cosine similarity (0-1)
     */
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vector dimensions must match');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] ** 2;
            normB += vecB[i] ** 2;
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Hash embedding to create consistent cache key
     * @private
     * @param {number[]} embedding - Embedding vector
     * @returns {Promise<string>} MD5 hash
     */
    async hashEmbedding(embedding) {
        const crypto = await import('crypto');
        const str = embedding.slice(0, 10).join(',');
        return crypto.default.createHash('md5').update(str).digest('hex');
    }

    /**
     * Invalidate cache for a specific product
     * Used when product data changes
     * @param {string} productId - Product ID
     * @returns {Promise<number>} Number of cache entries invalidated
     */
    async invalidateProduct(productId) {
        if (!this.enabled || !this.client) {
            return 0;
        }

        try {
            const keys = await this.client.keys(`${this.cachePrefix}*`);
            let invalidated = 0;

            for (const key of keys) {
                const cached = await this.client.get(key);
                if (!cached) continue;

                const { results } = JSON.parse(cached);

                // Check if this cached result contains the updated product
                const containsProduct = results.suggested_products?.some(
                    p => p._id?.toString() === productId
                );

                if (containsProduct) {
                    await this.client.del(key);
                    invalidated++;
                }
            }

            if (invalidated > 0) {
                logger.info('Semantic cache invalidated for product', {
                    productId,
                    entriesInvalidated: invalidated
                });
            }

            return invalidated;

        } catch (error) {
            logError('Cache invalidation failed', error, { productId });
            return 0;
        }
    }

    /**
     * Flush all semantic cache entries
     * @returns {Promise<void>}
     */
    async flush() {
        if (!this.enabled || !this.client) {
            return;
        }

        try {
            const keys = await this.client.keys(`${this.cachePrefix}*`);

            if (keys.length > 0) {
                await this.client.del(keys);
            }

            // Reset stats
            this.stats = { hits: 0, misses: 0, errors: 0 };

            logger.info('Semantic cache flushed', { entriesDeleted: keys.length });

        } catch (error) {
            logError('Semantic cache flush failed', error);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : '0.00';

        return {
            enabled: this.enabled,
            connected: this.client?.isOpen || false,
            hits: this.stats.hits,
            misses: this.stats.misses,
            errors: this.stats.errors,
            hitRate: `${hitRate}%`,
            ttl: this.ttl,
            similarityThreshold: this.similarityThreshold
        };
    }

    /**
     * Disconnect from Redis
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            logger.info('Semantic cache disconnected');
        }
    }
}

// Singleton export
export const semanticCache = new SemanticCache();

// Auto-connect on import (non-blocking)
if (process.env.ENABLE_SEMANTIC_CACHE === 'true') {
    semanticCache.connect().catch(err => {
        logWarning('Semantic cache auto-connect failed', { error: err.message });
    });
}

export default SemanticCache;
