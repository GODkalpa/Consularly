# Performance Best Practices

This document outlines performance best practices for the Mock Interview Platform to maintain optimal dashboard load times and user experience.

## Table of Contents
1. [Frontend Performance](#frontend-performance)
2. [Backend Performance](#backend-performance)
3. [Caching Strategy](#caching-strategy)
4. [Bundle Optimization](#bundle-optimization)
5. [Monitoring](#monitoring)

## Frontend Performance

### React Component Optimization

#### Use React.memo for Pure Components
```typescript
// ✅ Good - Memoized component
export const StatCard = React.memo<StatCardProps>(({ label, value, trend }) => {
  return <Card>...</Card>
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return prevProps.value === nextProps.value && 
         prevProps.trend === nextProps.trend
})

// ❌ Bad - Component re-renders on every parent update
export const StatCard = ({ label, value, trend }) => {
  return <Card>...</Card>
}
```

#### Use useMemo for Expensive Calculations
```typescript
// ✅ Good - Calculation only runs when data changes
const points = useMemo(() => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  return data.map((value, index) => calculatePoint(value, index, max, min))
}, [data])

// ❌ Bad - Calculation runs on every render
const points = data.map((value, index) => calculatePoint(value, index, max, min))
```

#### Use useCallback for Event Handlers
```typescript
// ✅ Good - Function reference stays stable
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])

// ❌ Bad - New function created on every render
const handleClick = () => {
  doSomething(id)
}
```

### Context Optimization

#### Split Contexts by Concern
```typescript
// ✅ Good - Separate contexts for different concerns
<UserProvider>
  <ProfileProvider>
    <AuthActionsProvider>
      {children}
    </AuthActionsProvider>
  </ProfileProvider>
</UserProvider>

// ❌ Bad - Single context with all state
<AuthProvider value={{ user, profile, isAdmin, signIn, signOut, ... }}>
  {children}
</AuthProvider>
```

Components only re-render when their specific context slice changes.

### Loading State Optimization

#### Initialize Based on Cache Availability
```typescript
// ✅ Good - No loading flash if cache exists
const [loading, setLoading] = useState(() => {
  const cached = cache.get(`dashboard_${orgId}`)
  return !cached.data // Only show loading if no cache
})

// ❌ Bad - Always shows loading state first
const [loading, setLoading] = useState(true)
```

## Backend Performance

### Database Query Optimization

#### Use Single Queries with Filters
```typescript
// ✅ Good - Single query with orgId filter
const students = await adminDb()
  .collection('orgStudents')
  .where('orgId', '==', orgId)
  .get()

// ❌ Bad - Multiple batched queries
const chunks = chunkArray(studentIds, 10)
const results = await Promise.all(
  chunks.map(chunk => 
    adminDb().collection('orgStudents').where('__name__', 'in', chunk).get()
  )
)
```

#### Implement Caching Layers
```typescript
// ✅ Good - In-memory cache with TTL
const cachedName = studentNameCache.get(studentId)
if (cachedName) {
  return cachedName
}

const student = await fetchStudent(studentId)
studentNameCache.set(studentId, student.name)
return student.name
```

#### Parallel Query Execution
```typescript
// ✅ Good - All queries run in parallel
const [org, students, interviews] = await Promise.all([
  getOrganization(orgId),
  getStudents(orgId),
  getInterviews(orgId)
])

// ❌ Bad - Sequential queries
const org = await getOrganization(orgId)
const students = await getStudents(orgId)
const interviews = await getInterviews(orgId)
```

### API Response Optimization

#### Enable Compression
```typescript
// ✅ Good - Compressed response for large payloads
import { compressedJsonResponse } from '@/lib/compression-middleware'

const response = compressedJsonResponse(data)
```

#### Add Aggressive Caching Headers
```typescript
// ✅ Good - 5 minute cache with stale-while-revalidate
response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
response.headers.set('ETag', etag)
```

## Caching Strategy

### Client-Side Cache (localStorage)

#### Stale-While-Revalidate Pattern
```typescript
// ✅ Good - Return cached data immediately, fetch fresh in background
const cached = cache.get(key)
if (cached.data) {
  if (cached.isStale) {
    // Fetch fresh data in background
    fetcher().then(fresh => cache.set(key, fresh))
  }
  return cached.data
}
```

#### Prefetch on Authentication
```typescript
// ✅ Good - Prefetch dashboard data when user logs in
if (profile?.orgId) {
  prefetch(`dashboard_${profile.orgId}`, async () => {
    const res = await fetch('/api/org/dashboard', { headers })
    return await res.json()
  }, { ttl: 60 * 1000 })
}
```

### Server-Side Cache

#### In-Memory Cache with TTL
```typescript
// ✅ Good - Cache student names for 5 minutes
class StudentNameCache {
  private cache = new Map<string, { name: string; timestamp: number }>()
  private ttl = 5 * 60 * 1000

  get(id: string): string | null {
    const entry = this.cache.get(id)
    if (!entry || Date.now() - entry.timestamp > this.ttl) {
      return null
    }
    return entry.name
  }
}
```

### Cache Invalidation

#### Invalidate on Mutations
```typescript
// ✅ Good - Clear cache when data changes
await updateOrganization(orgId, data)
invalidate(`dashboard_${orgId}`)
```

## Bundle Optimization

### Code Splitting

#### Lazy Load Heavy Components
```typescript
// ✅ Good - Component only loads when needed
const AdminDashboard = lazy(() => import('./AdminDashboard'))

// ❌ Bad - Component included in main bundle
import { AdminDashboard } from './AdminDashboard'
```

#### Split Vendor Chunks
```javascript
// next.config.js
webpack: (config) => {
  config.optimization.splitChunks = {
    cacheGroups: {
      firebase: {
        test: /[\\/]node_modules[\\/](firebase)/,
        name: 'firebase',
        chunks: 'async',
        priority: 20,
        enforce: true,
      },
      tensorflow: {
        test: /[\\/]node_modules[\\/](@tensorflow)/,
        name: 'tensorflow',
        chunks: 'async',
        priority: 25,
        enforce: true,
      }
    }
  }
}
```

### Dynamic Imports

#### Load Features On-Demand
```typescript
// ✅ Good - Feature loads when user clicks
const handleStartInterview = async () => {
  const { InterviewRunner } = await import('./InterviewRunner')
  // Use InterviewRunner
}

// ❌ Bad - Feature loaded upfront
import { InterviewRunner } from './InterviewRunner'
```

## Monitoring

### Performance Metrics

#### Track API Response Times
```typescript
import { performanceMonitor } from '@/lib/performance-monitor'

const startTime = Date.now()
const data = await fetchData()
performanceMonitor.record('api:dashboard', Date.now() - startTime)
```

#### Track Cache Hit Rates
```typescript
import { cacheTracker } from '@/lib/performance-monitor'

const cached = cache.get(key)
if (cached.data) {
  cacheTracker.recordHit()
} else {
  cacheTracker.recordMiss()
}

// Get stats
const stats = cacheTracker.getStats()
console.log(`Cache hit rate: ${stats.hitRate}%`)
```

#### Track Component Render Times
```typescript
import { useRenderTime } from '@/lib/performance-monitor'

function MyComponent() {
  useRenderTime('MyComponent')
  return <div>...</div>
}
```

### Performance Targets

- **Dashboard Load Time (Cached)**: < 1 second
- **Dashboard Load Time (Cold Start)**: < 2 seconds
- **API Response Time**: < 500ms
- **Cache Hit Rate**: > 80%
- **Bundle Size (Initial)**: < 500KB
- **Time to Interactive**: < 3 seconds

### Monitoring Tools

1. **React DevTools Profiler**: Identify unnecessary re-renders
2. **Chrome DevTools Performance**: Analyze runtime performance
3. **Chrome DevTools Network**: Check API response times and caching
4. **Lighthouse**: Measure overall performance score
5. **Bundle Analyzer**: Visualize bundle composition

## Code Review Checklist

When reviewing code for performance:

- [ ] Are expensive calculations wrapped in `useMemo`?
- [ ] Are event handlers wrapped in `useCallback`?
- [ ] Are pure components wrapped in `React.memo`?
- [ ] Are heavy components lazy-loaded?
- [ ] Are API calls cached appropriately?
- [ ] Are database queries optimized (no N+1 queries)?
- [ ] Are responses compressed for large payloads?
- [ ] Are cache headers set correctly?
- [ ] Is loading state initialized based on cache?
- [ ] Are contexts split by concern?

## Common Anti-Patterns to Avoid

### ❌ Creating Components Inside Render Functions
```typescript
// Bad - Component recreated on every render
const MyComponent = () => {
  const NestedComponent = () => <div>...</div>
  return <NestedComponent />
}
```

### ❌ Inline Object/Array Props
```typescript
// Bad - New object created on every render
<MyComponent data={{ value: 1 }} />

// Good - Stable reference
const data = useMemo(() => ({ value: 1 }), [])
<MyComponent data={data} />
```

### ❌ Fetching Data on Every Mount
```typescript
// Bad - Fetches even when cached
useEffect(() => {
  fetchData()
}, [])

// Good - Check cache first
useEffect(() => {
  const cached = cache.get(key)
  if (cached.data) {
    setData(cached.data)
  } else {
    fetchData()
  }
}, [])
```

### ❌ Large Context Values
```typescript
// Bad - Everything in one context
const value = { user, profile, settings, preferences, ... }

// Good - Split by concern
<UserContext.Provider value={{ user }}>
  <ProfileContext.Provider value={{ profile }}>
    ...
  </ProfileContext.Provider>
</UserContext.Provider>
```

## Resources

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Last Updated**: November 2025
**Maintained By**: Development Team
