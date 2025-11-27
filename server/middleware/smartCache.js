/**
 * Enhanced cache strategy với fallback mechanisms
 * Tối ưu cho production với MongoDB persistence
 */
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
});

/**
 * Smart cache với MongoDB fallback
 * Giải quyết vấn đề mất cache khi restart
 */
export class SmartCache {
  /**
   * Get data với warm-up strategy
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch fresh data
   * @param {number} ttl - Time to live in seconds
   */
  static async getOrFetch(key, fetchFn, ttl = 300) {
    // 1. Try cache first (fastest)
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // 2. Cache miss - fetch fresh data
    const data = await fetchFn();
    
    // 3. Store in cache for next time
    cache.set(key, data, ttl);
    
    return data;
  }

  /**
   * Invalidate cache khi data thay đổi
   */
  static invalidate(pattern) {
    const keys = cache.keys();
    const matchedKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchedKeys);
    return matchedKeys.length;
  }

  /**
   * Warm up cache - pre-load critical data khi server start
   * Giảm impact của cold start
   */
  static async warmUp(criticalData) {
    for (const { key, fetchFn, ttl } of criticalData) {
      try {
        const data = await fetchFn();
        cache.set(key, data, ttl);
        console.log(`✅ Warmed up cache: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to warm up ${key}:`, error.message);
      }
    }
  }
}

/**
 * Cache warming strategy khi server start
 * Giảm thiểu impact khi restart/mất điện
 */
export const warmUpCache = async () => {
  const criticalEndpoints = [
    {
      key: 'categories:main',
      fetchFn: async () => {
        const Category = (await import('../models/CategoryModel.js')).default;
        return Category.find({ isActive: true, parentCategory: null }).lean();
      },
      ttl: 900, // 15 minutes
    },
    {
      key: 'colors:all',
      fetchFn: async () => {
        const Color = (await import('../models/ColorModel.js')).default;
        return Color.find({}).lean();
      },
      ttl: 1800, // 30 minutes
    },
    // Add more critical data here
  ];

  await SmartCache.warmUp(criticalEndpoints);
};

export { cache };
export default cache;
