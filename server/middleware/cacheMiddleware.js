import NodeCache from 'node-cache';

/**
 * Simple in-memory cache for API responses
 * TTL: Time To Live in seconds
 * checkperiod: Automatic cleanup interval
 */
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone data (faster, but be careful with mutations)
});

/**
 * Cache middleware factory
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Cache hit
      return res.json(cachedResponse);
    }

    // Cache miss - override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body, duration);
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys (e.g., '/api/products')
 */
export const clearCache = (pattern) => {
  const keys = cache.keys();
  const matchedKeys = keys.filter(key => key.includes(pattern));
  cache.del(matchedKeys);
  return matchedKeys.length;
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  cache.flushAll();
};

export default cache;
