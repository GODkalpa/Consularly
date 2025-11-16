/**
 * Performance Monitoring Utility
 * Tracks API response times, cache hit rates, and render times
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000 // Keep last 1000 metrics

  /**
   * Record a performance metric
   */
  record(name: string, value: number, metadata?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata
    })

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}ms`, metadata || '')
    }
  }

  /**
   * Get average for a specific metric
   */
  getAverage(name: string, timeWindowMs?: number): number {
    const now = Date.now()
    const relevantMetrics = this.metrics.filter(m => {
      const matchesName = m.name === name
      const inTimeWindow = !timeWindowMs || (now - m.timestamp) <= timeWindowMs
      return matchesName && inTimeWindow
    })

    if (relevantMetrics.length === 0) return 0

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / relevantMetrics.length
  }

  /**
   * Get all metrics for a specific name
   */
  getMetrics(name: string, limit = 100): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit)
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metricNames = [...new Set(this.metrics.map(m => m.name))]
    
    return metricNames.map(name => ({
      name,
      average: this.getAverage(name),
      count: this.metrics.filter(m => m.name === name).length,
      recent: this.getAverage(name, 5 * 60 * 1000) // Last 5 minutes
    }))
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Helper to measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    performanceMonitor.record(name, duration, metadata)
    return result
  } catch (error) {
    const duration = Date.now() - start
    performanceMonitor.record(name, duration, { ...metadata, error: true })
    throw error
  }
}

/**
 * Helper to measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = Date.now()
  try {
    const result = fn()
    const duration = Date.now() - start
    performanceMonitor.record(name, duration, metadata)
    return result
  } catch (error) {
    const duration = Date.now() - start
    performanceMonitor.record(name, duration, { ...metadata, error: true })
    throw error
  }
}

/**
 * React hook for measuring component render time
 */
export function useRenderTime(componentName: string) {
  if (typeof window === 'undefined') return

  const startTime = performance.now()
  
  // Use useEffect to measure after render
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const renderTime = performance.now() - startTime
      performanceMonitor.record(`render:${componentName}`, renderTime)
    })
  }
}

/**
 * Cache hit rate tracker
 */
class CacheTracker {
  private hits = 0
  private misses = 0

  recordHit() {
    this.hits++
  }

  recordMiss() {
    this.misses++
  }

  getHitRate(): number {
    const total = this.hits + this.misses
    return total === 0 ? 0 : (this.hits / total) * 100
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      total: this.hits + this.misses
    }
  }

  reset() {
    this.hits = 0
    this.misses = 0
  }
}

export const cacheTracker = new CacheTracker()
