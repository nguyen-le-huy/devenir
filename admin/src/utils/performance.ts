/**
 * Performance utilities for optimizing the admin panel
 */

/**
 * Debounce function to limit how often a function is called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * Throttle function to ensure function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Batch multiple API calls into a single Promise.all
 */
export async function batchRequests<T>(
  requests: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(req => req()))
    results.push(...batchResults)
  }
  
  return results
}

/**
 * Cache manager for API responses
 */
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  get<T>(key: string, ttl?: number): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > (ttl || this.defaultTTL)) {
      this.cache.delete(key)
      return null
    }

    return cached.data as T
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }
}

export const apiCache = new CacheManager()
