/**
 * Performance Benchmarking Utility
 * Tracks and analyzes evaluation performance metrics
 */

export interface EvaluationMetrics {
  interviewId: string
  route: string
  questionCount: number
  timing: {
    promptBuild: number
    llmCall: number
    parse: number
    total: number
  }
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  provider: string
  model: string
  retryCount: number
  success: boolean
  error?: string
  timestamp: Date
}

export interface PerformanceStats {
  p50: number
  p95: number
  p99: number
  mean: number
  min: number
  max: number
  successRate: number
  totalSamples: number
}

/**
 * In-memory metrics storage (for development/testing)
 * In production, this should be replaced with a proper metrics service
 */
class PerformanceTracker {
  private metrics: EvaluationMetrics[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 evaluations

  /**
   * Log an evaluation metric
   */
  logMetric(metric: EvaluationMetrics): void {
    this.metrics.push(metric)
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
    
    // Log to console for monitoring
    console.log('📊 [Performance Tracker]', {
      interviewId: metric.interviewId,
      totalMs: metric.timing.total,
      llmMs: metric.timing.llmCall,
      success: metric.success,
      provider: metric.provider,
      retries: metric.retryCount
    })
    
    // Alert if performance is degraded
    if (metric.timing.total > 10000) {
      console.warn('⚠️ [Performance Alert] Evaluation exceeded 10s:', {
        interviewId: metric.interviewId,
        totalMs: metric.timing.total,
        provider: metric.provider
      })
    }
  }

  /**
   * Get performance statistics for successful evaluations
   */
  getStats(timeWindowMs?: number): PerformanceStats {
    const now = Date.now()
    const cutoff = timeWindowMs ? now - timeWindowMs : 0
    
    const relevantMetrics = this.metrics.filter(m => 
      m.success && m.timestamp.getTime() > cutoff
    )
    
    if (relevantMetrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        mean: 0,
        min: 0,
        max: 0,
        successRate: 0,
        totalSamples: 0
      }
    }
    
    const totalTimes = relevantMetrics.map(m => m.timing.total).sort((a, b) => a - b)
    const allMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff)
    
    return {
      p50: this.percentile(totalTimes, 50),
      p95: this.percentile(totalTimes, 95),
      p99: this.percentile(totalTimes, 99),
      mean: totalTimes.reduce((sum, t) => sum + t, 0) / totalTimes.length,
      min: totalTimes[0],
      max: totalTimes[totalTimes.length - 1],
      successRate: (relevantMetrics.length / allMetrics.length) * 100,
      totalSamples: allMetrics.length
    }
  }

  /**
   * Get statistics by provider
   */
  getStatsByProvider(provider: string, timeWindowMs?: number): PerformanceStats {
    const now = Date.now()
    const cutoff = timeWindowMs ? now - timeWindowMs : 0
    
    const relevantMetrics = this.metrics.filter(m => 
      m.success && m.provider === provider && m.timestamp.getTime() > cutoff
    )
    
    if (relevantMetrics.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        mean: 0,
        min: 0,
        max: 0,
        successRate: 0,
        totalSamples: 0
      }
    }
    
    const totalTimes = relevantMetrics.map(m => m.timing.total).sort((a, b) => a - b)
    const allProviderMetrics = this.metrics.filter(m => 
      m.provider === provider && m.timestamp.getTime() > cutoff
    )
    
    return {
      p50: this.percentile(totalTimes, 50),
      p95: this.percentile(totalTimes, 95),
      p99: this.percentile(totalTimes, 99),
      mean: totalTimes.reduce((sum, t) => sum + t, 0) / totalTimes.length,
      min: totalTimes[0],
      max: totalTimes[totalTimes.length - 1],
      successRate: (relevantMetrics.length / allProviderMetrics.length) * 100,
      totalSamples: allProviderMetrics.length
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, index)]
  }

  /**
   * Get recent failures for debugging
   */
  getRecentFailures(count: number = 10): EvaluationMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-count)
      .reverse()
  }

  /**
   * Print performance report
   */
  printReport(timeWindowMs?: number): void {
    const stats = this.getStats(timeWindowMs)
    const windowDesc = timeWindowMs ? `last ${timeWindowMs / 1000}s` : 'all time'
    
    console.log(`\n📊 Performance Report (${windowDesc}):`)
    console.log(`  Samples: ${stats.totalSamples}`)
    console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`)
    console.log(`  P50 Latency: ${Math.round(stats.p50)}ms`)
    console.log(`  P95 Latency: ${Math.round(stats.p95)}ms`)
    console.log(`  P99 Latency: ${Math.round(stats.p99)}ms`)
    console.log(`  Mean Latency: ${Math.round(stats.mean)}ms`)
    console.log(`  Min/Max: ${Math.round(stats.min)}ms / ${Math.round(stats.max)}ms`)
    
    // Provider breakdown
    const providers = [...new Set(this.metrics.map(m => m.provider))]
    if (providers.length > 1) {
      console.log(`\n  By Provider:`)
      providers.forEach(provider => {
        const providerStats = this.getStatsByProvider(provider, timeWindowMs)
        if (providerStats.totalSamples > 0) {
          console.log(`    ${provider}: P50=${Math.round(providerStats.p50)}ms, Success=${providerStats.successRate.toFixed(1)}% (n=${providerStats.totalSamples})`)
        }
      })
    }
    
    // Recent failures
    const failures = this.getRecentFailures(5)
    if (failures.length > 0) {
      console.log(`\n  Recent Failures:`)
      failures.forEach(f => {
        console.log(`    ${f.interviewId}: ${f.error || 'Unknown error'} (${f.provider})`)
      })
    }
    
    console.log('')
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = []
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker()

/**
 * Helper to create evaluation metric from API response
 */
export function createEvaluationMetric(
  interviewId: string,
  route: string,
  questionCount: number,
  timing: { promptBuild: number; llmCall: number; parse: number; total: number },
  tokens: { prompt: number; completion: number; total: number },
  provider: string,
  model: string,
  retryCount: number,
  success: boolean,
  error?: string
): EvaluationMetrics {
  return {
    interviewId,
    route,
    questionCount,
    timing,
    tokens,
    provider,
    model,
    retryCount,
    success,
    error,
    timestamp: new Date()
  }
}
