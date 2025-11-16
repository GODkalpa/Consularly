/**
 * Aggressive client-side cache for instant dashboard loads
 * Uses localStorage with TTL and stale-while-revalidate pattern
 */

import { cacheTracker } from './performance-monitor'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleTime?: number // Time before data is considered stale
}

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_STALE_TIME = 30 * 1000 // 30 seconds

export class ClientCache {
  private prefix = 'dash_cache_'

  /**
   * Get data from cache
   * Returns { data, isStale } - always returns cached data if available
   */
  get<T>(key: string): { data: T | null; isStale: boolean } {
    try {
      const cached = localStorage.getItem(this.prefix + key)
      if (!cached) {
        cacheTracker.recordMiss()
        return { data: null, isStale: false }
      }

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()
      const age = now - entry.timestamp

      // Check if expired
      if (age > entry.ttl) {
        this.remove(key)
        cacheTracker.recordMiss()
        return { data: null, isStale: false }
      }

      // Check if stale (but still valid)
      const isStale = age > DEFAULT_STALE_TIME
      cacheTracker.recordHit()

      return { data: entry.data, isStale }
    } catch (e) {
      console.warn('[Cache] Failed to get:', key, e)
      cacheTracker.recordMiss()
      return { data: null, isStale: false }
    }
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options?.ttl || DEFAULT_TTL,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(entry))
    } catch (e) {
      console.warn('[Cache] Failed to set:', key, e)
      // localStorage might be full, clear old entries
      this.cleanup()
    }
  }

  /**
   * Remove specific cache entry
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (e) {
      console.warn('[Cache] Failed to remove:', key, e)
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('[Cache] Failed to clear:', e)
    }
  }

  /**
   * Remove expired entries to free up space
   */
  cleanup(): void {
    try {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach(key => {
        if (!key.startsWith(this.prefix)) return

        try {
          const cached = localStorage.getItem(key)
          if (!cached) return

          const entry: CacheEntry<unknown> = JSON.parse(cached)
          if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key)
          }
        } catch (e) {
          // Invalid entry, remove it
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('[Cache] Cleanup failed:', e)
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { count: number; size: number } {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix))
      let size = 0
      keys.forEach(key => {
        const item = localStorage.getItem(key)
        if (item) size += item.length
      })
      return { count: keys.length, size }
    } catch (e) {
      return { count: 0, size: 0 }
    }
  }
}

// Singleton instance
export const cache = new ClientCache()

/**
 * Fetch with cache - stale-while-revalidate pattern
 * Returns cached data immediately if available, then fetches fresh data in background
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try cache first
  const cached = cache.get<T>(key)
  
  if (cached.data) {
    // Return cached data immediately
    if (!cached.isStale) {
      return cached.data
    }

    // Data is stale, fetch in background but return cached for now
    fetcher()
      .then(fresh => cache.set(key, fresh, options))
      .catch(err => console.warn('[Cache] Background refresh failed:', err))
    
    return cached.data
  }

  // No cache, fetch and cache
  const data = await fetcher()
  cache.set(key, data, options)
  return data
}

/**
 * Prefetch and cache data
 * Fire and forget - doesn't return anything
 */
export function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): void {
  // Check if already cached and fresh
  const cached = cache.get<T>(key)
  if (cached.data && !cached.isStale) {
    return // Already fresh, no need to prefetch
  }

  // Fetch in background
  fetcher()
    .then(data => cache.set(key, data, options))
    .catch(err => console.warn('[Cache] Prefetch failed:', key, err))
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidate(pattern: string): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes(pattern)) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.warn('[Cache] Invalidation failed:', e)
  }
}
