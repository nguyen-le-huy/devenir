/**
 * Redis Cache Service
 * Cache image search results để giảm latency cho repeat queries
 * 
 * Environment Variables:
 * - REDIS_URL: URL to Redis server (default: redis://localhost:6379)
 * - DISABLE_REDIS: Set to 'true' to disable Redis (for development without Docker)
 */

import { createClient } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_PREFIX = 'visual-search:';
const CACHE_TTL = 3600; // 1 hour
const DISABLE_REDIS = process.env.DISABLE_REDIS === 'true';

let redisClient = null;
let isConnected = false;
let initAttempted = false;  // Only try once

/**
 * Initialize Redis client
 */
export async function initRedisCache() {
    // Skip if disabled
    if (DISABLE_REDIS) {
        console.log('⚠️ Redis disabled via DISABLE_REDIS env. Caching will not work.');
        return null;
    }

    // Only try to connect once
    if (initAttempted) {
        return redisClient;
    }
    initAttempted = true;

    if (redisClient && isConnected) return redisClient;

    try {
        redisClient = createClient({
            url: REDIS_URL,
            socket: {
                connectTimeout: 5000,  // 5 second timeout
                reconnectStrategy: false  // Don't auto-retry (prevents console spam)
            }
        });

        redisClient.on('error', (err) => {
            if (isConnected) {  // Only log if was previously connected
                console.error('❌ Redis connection lost:', err.message);
            }
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
            isConnected = true;
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('⚠️ Redis init failed:', error.message);
        console.log('⚠️ Continuing without cache - Image search will work but slower for repeat queries');
        console.log('💡 Tip: Start Redis with: docker run -d -p 6379:6379 redis');
        console.log('💡 Or disable with: DISABLE_REDIS=true npm run dev');
        redisClient = null;
        isConnected = false;
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
