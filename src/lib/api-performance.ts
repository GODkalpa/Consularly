// API Performance Monitoring Utility
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<any>, 
  name: string
) {
  return async (...args: T) => {
    const start = Date.now()
    console.log(`[API] 🚀 ${name} starting...`)
    
    try {
      const result = await handler(...args)
      const duration = Date.now() - start
      console.log(`[API] ✅ ${name} completed in ${duration}ms`)
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`[API] ❌ ${name} failed after ${duration}ms:`, error)
      throw error
    }
  }
}

export function logStep(step: string, startTime: number = Date.now()) {
  return {
    step,
    startTime,
    end: (description?: string) => {
      const duration = Date.now() - startTime
      console.log(`[API] ⏱️  ${step}${description ? `: ${description}` : ''} took ${duration}ms`)
      return Date.now()
    }
  }
}
