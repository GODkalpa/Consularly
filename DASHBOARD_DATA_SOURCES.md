# Dashboard Data Sources

## Overview
This document explains **exactly where each metric in the organization dashboard comes from** to ensure data accuracy and prevent misinformation.

## ✅ Real Data Sources (From Firestore)

All dashboard metrics now fetch **real-time data from Firestore collections**.

### API Endpoint
```
GET /api/org/statistics
```

**Location**: `src/app/api/org/statistics/route.ts`

### Data Sources Breakdown

#### 1. Total Students
```typescript
Source: orgStudents collection
Query: WHERE orgId == <current_org_id>
Count: Aggregated count query
```

**What it shows**: Number of students registered in the organization's student database (managed via Students tab).

**Firestore Path**: 
```
/orgStudents/{studentId}
  - orgId: string
  - name: string
  - email: string
  - ...other fields
```

#### 2. Interviews Conducted
```typescript
Source: interviews collection
Query: WHERE orgId == <current_org_id>
Count: Total documents matching query
```

**What it shows**: Total number of interviews conducted by this organization (all time or filtered by date if needed).

**Firestore Path**:
```
/interviews/{interviewId}
  - orgId: string
  - candidateName: string
  - finalScore: number
  - createdAt: Timestamp
  - status: string
  - ...other fields
```

#### 3. Average Success Score
```typescript
Source: interviews collection
Query: WHERE orgId == <current_org_id> AND finalScore exists
Calculation: 
  - Filter interviews with valid scores (finalScore >= 0)
  - Sum all scores
  - Divide by count
  - Round to nearest integer
```

**What it shows**: Average performance score across all scored interviews. Shows "—" if no scored interviews exist.

**Logic**:
```javascript
const scoredInterviews = interviews.filter(doc => 
  typeof doc.data().finalScore === 'number' && 
  doc.data().finalScore >= 0
)

avgScore = Math.round(
  scoredInterviews.reduce((sum, doc) => sum + doc.data().finalScore, 0) 
  / scoredInterviews.length
)
```

#### 4. Quota Remaining
```typescript
Source: organizations collection
Query: Direct fetch of organization document
Calculation: quotaLimit - quotaUsed
```

**What it shows**: Remaining interview quota for current month.

**Firestore Path**:
```
/organizations/{orgId}
  - quotaLimit: number (max interviews allowed)
  - quotaUsed: number (interviews conducted this month)
```

#### 5. Active Users
```typescript
Source: users collection
Query: WHERE orgId == <current_org_id>
Count: Aggregated count query
```

**What it shows**: Number of users (admins + members) associated with this organization.

**Firestore Path**:
```
/users/{userId}
  - orgId: string
  - role: 'admin' | 'org_member' | 'super_admin'
  - ...other fields
```

#### 6. Recent Activity
```typescript
Source: interviews collection
Query: WHERE orgId == <current_org_id>
Limit: 5 most recent (by createdAt)
```

**What it shows**: Last 5 interviews with:
- Candidate name
- Date/time
- Score (if available)
- Status

## 🔄 Data Flow

```
User Opens Dashboard
    ↓
OrganizationDashboard.tsx loads
    ↓
useEffect triggers on mount
    ↓
Parallel API calls:
  1. GET /api/org/organization (org details)
  2. GET /api/org/statistics (metrics)
    ↓
/api/org/statistics/route.ts:
  - Verifies user authentication
  - Checks orgId permission
  - Queries Firestore collections in parallel:
    * orgStudents (count)
    * interviews (all + process)
    * users (count)
    ↓
Returns statistics object
    ↓
Dashboard updates with real data
    ↓
Metrics cards display live counts
```

## ⚠️ No Mock Data

**Previous Implementation** (REMOVED):
```typescript
// ❌ OLD - Mock data
const stats = {
  totalStudents: 0,
  totalInterviews: quotaUsed,
  avgScore: 0,
  activeUsers: 0,
}
```

**Current Implementation** (LIVE):
```typescript
// ✅ NEW - Real data from API
const stats = statistics || {
  totalStudents: 0,      // Fallback while loading
  totalInterviews: 0,
  avgScore: 0,
  activeUsers: 0,
  recentInterviews: [],
}
```

## 📊 Data Accuracy Guarantees

### Security
- ✅ All requests require Firebase ID token authentication
- ✅ Users can only access their organization's data
- ✅ Server-side validation prevents unauthorized access

### Performance
- ✅ Parallel API calls (organization + statistics fetched together)
- ✅ Firestore count queries (efficient aggregation)
- ✅ Limited results for recent activity (last 5)

### Real-Time
- ✅ Data fetched on every dashboard load
- ✅ Reflects current state of database
- ✅ No caching (always fresh)

## 🔍 Verification Steps

To verify data accuracy:

### 1. Check Firestore Console
```
Firebase Console → Firestore Database
- /orgStudents: Count documents with your orgId
- /interviews: Count documents with your orgId
- /interviews: Check finalScore fields for average
```

### 2. Browser DevTools
```
Network Tab → API Calls
- /api/org/statistics
- Response shows exact counts from database
```

### 3. Compare with Other Sections
```
Dashboard "Total Students" 
  = Students Tab (count of rows)

Dashboard "Interviews Conducted" 
  = Results Tab (total interviews shown)
```

## 📝 Future Enhancements

### Real-Time Updates
Currently: Data fetched once on load  
Future: Subscribe to Firestore changes with `onSnapshot`

```typescript
// Potential improvement
onSnapshot(
  query(collection(db, 'interviews'), where('orgId', '==', orgId)),
  (snapshot) => {
    // Update metrics in real-time
  }
)
```

### Date Filtering
Currently: All-time statistics  
Future: Filter by date range

```typescript
// Example
statistics?startDate=2025-01-01&endDate=2025-01-31
```

### Caching Strategy
Currently: No caching  
Future: Cache with revalidation

```typescript
// Example with SWR or React Query
const { data: statistics } = useSWR('/api/org/statistics', {
  revalidateOnFocus: true,
  refreshInterval: 30000, // 30 seconds
})
```

## ⚡ Performance Metrics

Expected API response times:
- Small org (< 100 students, < 500 interviews): **< 500ms**
- Medium org (100-1000 students, 500-5000 interviews): **< 1000ms**
- Large org (> 1000 students, > 5000 interviews): **< 2000ms**

If performance degrades:
1. Add Firestore indexes
2. Implement pagination for interviews
3. Add server-side caching
4. Use Firestore aggregation queries

## 🎯 Data Integrity

### What Could Show Zero
- **New organizations** with no data yet
- **During loading** (brief moment before API responds)
- **Permission errors** (shouldn't happen with proper auth)

### What Should Never Be Zero
Once data exists:
- Total Students: Only zero if no students added
- Interviews: Only zero if none conducted
- Avg Score: Shows "—" if no scored interviews
- Active Users: Minimum 1 (the user viewing the dashboard)

## 📚 Related Files

**API Endpoint**:
- `src/app/api/org/statistics/route.ts`

**Frontend Component**:
- `src/components/org/OrganizationDashboard.tsx`

**Type Definitions**:
- `src/types/firestore.ts`

**Database Schema**:
- `firestore-schema.md`

---

**Last Updated**: 2025-01-30  
**Verified**: All metrics now use real Firestore data with proper authentication and authorization.
