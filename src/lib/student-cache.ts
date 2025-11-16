// In-memory cache for student names with TTL
interface CacheEntry {
  name: string
  timestamp: number
}

class StudentNameCache {
  private cache = new Map<string, CacheEntry>()
  private ttl = 5 * 60 * 1000 // 5 minutes

  set(studentId: string, name: string) {
    this.cache.set(studentId, {
      name,
      timestamp: Date.now()
    })
  }

  get(studentId: string): string | null {
    const entry = this.cache.get(studentId)
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(studentId)
      return null
    }
    
    return entry.name
  }

  setMany(entries: Array<{ id: string; name: string }>) {
    const timestamp = Date.now()
    entries.forEach(({ id, name }) => {
      this.cache.set(id, { name, timestamp })
    })
  }

  clear() {
    this.cache.clear()
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const studentNameCache = new StudentNameCache()

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => studentNameCache.cleanup(), 10 * 60 * 1000)
}
