/**
 * Branding Cache Utility
 * 
 * Provides client-side caching for organization branding data
 * with TTL support and localStorage persistence.
 */

import { OrganizationBranding } from '@/types/firestore';

interface CacheEntry {
  data: OrganizationBranding;
  timestamp: number;
  ttl: number;
}

class BrandingCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly STORAGE_PREFIX = 'branding:';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get branding from cache
   * Returns null if not found or expired
   */
  get(orgId: string): OrganizationBranding | null {
    // Try in-memory cache first
    const entry = this.cache.get(orgId);
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp <= entry.ttl) {
        return entry.data;
      }
      // Expired, remove from cache
      this.cache.delete(orgId);
    }

    // Try localStorage
    return this.getFromStorage(orgId);
  }

  /**
   * Set branding in cache
   */
  set(orgId: string, data: OrganizationBranding, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Store in memory
    this.cache.set(orgId, entry);

    // Persist to localStorage
    this.setInStorage(orgId, entry);
  }

  /**
   * Invalidate cache for specific organization
   */
  invalidate(orgId: string): void {
    this.cache.delete(orgId);
    this.removeFromStorage(orgId);
  }

  /**
   * Clear all cached branding
   */
  clear(): void {
    this.cache.clear();
    this.clearStorage();
  }

  /**
   * Get branding from localStorage
   */
  private getFromStorage(orgId: string): OrganizationBranding | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + orgId);
      if (!stored) return null;

      const entry: CacheEntry = JSON.parse(stored);
      const now = Date.now();

      if (now - entry.timestamp <= entry.ttl) {
        // Still valid, restore to memory cache
        this.cache.set(orgId, entry);
        return entry.data;
      }

      // Expired, remove from storage
      this.removeFromStorage(orgId);
      return null;
    } catch (error) {
      console.error('Failed to read branding from localStorage:', error);
      return null;
    }
  }

  /**
   * Store branding in localStorage
   */
  private setInStorage(orgId: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.STORAGE_PREFIX + orgId,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Quota exceeded or other error, ignore
      console.warn('Failed to persist branding to localStorage:', error);
    }
  }

  /**
   * Remove branding from localStorage
   */
  private removeFromStorage(orgId: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_PREFIX + orgId);
    } catch (error) {
      console.error('Failed to remove branding from localStorage:', error);
    }
  }

  /**
   * Clear all branding from localStorage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear branding from localStorage:', error);
    }
  }
}

// Export singleton instance
export const brandingCache = new BrandingCache();
