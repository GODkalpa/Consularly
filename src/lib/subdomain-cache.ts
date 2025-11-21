/**
 * Subdomain Cache
 * 
 * In-memory cache for subdomain-to-organization mappings
 * to reduce Firestore queries and improve performance.
 */

export interface SubdomainCacheEntry {
  orgId: string;
  orgName: string;
  subdomain: string;
  subdomainEnabled: boolean;
  cachedAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class SubdomainCache {
  private cache: Map<string, SubdomainCacheEntry>;
  private TTL: number; // Time to live in milliseconds
  private hits: number;
  private misses: number;

  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.TTL = ttlMinutes * 60 * 1000;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached entry for subdomain
   */
  get(subdomain: string): SubdomainCacheEntry | null {
    const entry = this.cache.get(subdomain);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.cachedAt > this.TTL) {
      this.cache.delete(subdomain);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry;
  }

  /**
   * Set cache entry for subdomain
   */
  set(subdomain: string, entry: Omit<SubdomainCacheEntry, 'cachedAt'>): void {
    this.cache.set(subdomain, {
      ...entry,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate cache entry for subdomain
   */
  invalidate(subdomain: string): void {
    this.cache.delete(subdomain);
  }

  /**
   * Invalidate cache entry by organization ID
   */
  invalidateByOrgId(orgId: string): void {
    for (const [subdomain, entry] of this.cache.entries()) {
      if (entry.orgId === orgId) {
        this.cache.delete(subdomain);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [subdomain, entry] of this.cache.entries()) {
      if (now - entry.cachedAt > this.TTL) {
        this.cache.delete(subdomain);
      }
    }
  }

  /**
   * Get all cached subdomains (for debugging)
   */
  getAllSubdomains(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Export singleton instance
export const subdomainCache = new SubdomainCache(5); // 5 minute TTL

// Run cleanup every 10 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    subdomainCache.cleanup();
  }, 10 * 60 * 1000);
}
