/**
 * Redis Cache Service
 * Cache image search results để giảm latency cho repeat queries
 */

import { createClient } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_PREFIX = 'visual-search:';
const CACHE_TTL = 3600; // 1 hour

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
export async function initRedisCache() {
    if (redisClient && isConnected) return redisClient;

    try {
        redisClient = createClient({ url: REDIS_URL });

        redisClient.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
            isConnected = true;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('❌ Redis init failed:', error.message);
        console.log('⚠️ Continuing without cache...');
        return null;
    }
}

/**
 * Get Redis client
 */
export function getRedis() {
    return redisClient;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable() {
    return isConnected && redisClient !== null;
}

/**
 * Generate cache key from image content
 * @param {string} imageData - Base64 image or URL
 * @returns {string} - Hash key
 */
export function generateImageHash(imageData) {
    // Use first 1000 chars for URL, full content for base64
    const content = imageData.startsWith('http')
        ? imageData
        : imageData.substring(0, Math.min(imageData.length, 5000));

    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Get cached search results
 * @param {string} imageHash - MD5 hash of image
 * @returns {Promise<Array|null>} - Cached results or null
 */
export async function getCachedResults(imageHash) {
    if (!isRedisAvailable()) return null;

    try {
        const key = `${CACHE_PREFIX}${imageHash}`;
        const cached = await redisClient.get(key);

        if (cached) {
            console.log(`✅ Cache HIT: ${imageHash.substring(0, 8)}...`);
            return JSON.parse(cached);
        }

        console.log(`❌ Cache MISS: ${imageHash.substring(0, 8)}...`);
        return null;
    } catch (error) {
        console.error('Cache get error:', error.message);
        return null;
    }
}

/**
 * Cache search results
 * @param {string} imageHash - MD5 hash of image
 * @param {Array} results - Search results to cache
 * @param {number} ttl - Time to live in seconds (default 1 hour)
 */
export async function cacheResults(imageHash, results, ttl = CACHE_TTL) {
    if (!isRedisAvailable()) return;

    try {
        const key = `${CACHE_PREFIX}${imageHash}`;
        await redisClient.setEx(key, ttl, JSON.stringify(results));
        console.log(`💾 Cached: ${imageHash.substring(0, 8)}... (TTL: ${ttl}s)`);
    } catch (error) {
        console.error('Cache set error:', error.message);
    }
}

/**
 * Clear all visual search cache
 */
export async function clearCache() {
    if (!isRedisAvailable()) return;

    try {
        const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`🗑️ Cleared ${keys.length} cached entries`);
        }
    } catch (error) {
        console.error('Cache clear error:', error.message);
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
    if (!isRedisAvailable()) {
        return { available: false };
    }

    try {
        const keys = await redisClient.keys(`${CACHE_PREFIX}*`);
        const info = await redisClient.info('memory');

        return {
            available: true,
            cachedQueries: keys.length,
            memoryUsage: info.match(/used_memory_human:(\S+)/)?.[1] || 'N/A'
        };
    } catch (error) {
        return { available: false, error: error.message };
    }
}

/**
 * Close Redis connection
 */
export async function closeRedisCache() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isConnected = false;
        console.log('Redis connection closed');
    }
}
