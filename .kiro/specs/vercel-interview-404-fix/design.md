# Design Document

## Overview

The interview 404 error on Vercel occurs due to a race condition and architectural issue with how interview session data is passed to the interview page. The current implementation stores session initialization data in localStorage before navigating to `/interview/[id]`, but this approach has several failure modes in production:

1. **Cross-tab localStorage timing**: When opening in a new tab (`window.open`), the localStorage write in the parent tab may not complete before the child tab tries to read it
2. **Browser storage restrictions**: Some browsers/contexts restrict localStorage access across tabs or in certain deployment scenarios
3. **No server-side fallback**: The interview page has no way to fetch session data from the server if localStorage is empty
4. **404 vs actual error**: The page doesn't actually 404 - it loads but shows a blank/error state that might appear as a 404 to users

## Root Cause Analysis

### Current Flow

1. User clicks "Start Interview" in org/student/admin dashboard
2. Component calls `/api/interview/session` with action: 'start'
3. API returns session data and interview ID
4. Component stores data in localStorage: `interview:init:${sessionId}`
5. Component navigates to `/interview/${sessionId}` (often in new tab)
6. InterviewRunner component reads from localStorage
7. **FAILURE POINT**: If localStorage is empty, component shows error/blank state

### Why It Works Locally

- Faster localhost connections reduce timing window
- Same-origin policy is more permissive in development
- Browser caching and dev server behavior mask the issue

### Why It Fails on Vercel

- Network latency increases timing window
- Serverless cold starts add delay
- Production browser security policies are stricter
- Cross-tab storage synchronization is unreliable

## Architecture

### Proposed Solution: Hybrid Approach

Implement a multi-layered data loading strategy with fallbacks:

```
┌─────────────────────────────────────────────────────────────┐
│                    Interview Page Load                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Try localStorage (fast path)                       │
│  - Check for interview:init:${id}                            │
│  - If found: Use immediately                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (if not found)
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Try URL parameters (medium path)                   │
│  - Check for encoded session data in URL hash/query          │
│  - If found: Parse and use                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (if not found)
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Fetch from server (slow path)                      │
│  - Call /api/interview/session/${id} GET endpoint            │
│  - Reconstruct session from Firestore                        │
│  - If found: Use server data                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (if all fail)
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Show error with recovery options                   │
│  - Display user-friendly error message                       │
│  - Provide "Return to Dashboard" button                      │
│  - Log diagnostic information                                │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. API Route: `/api/interview/session/[id]/route.ts` (NEW)

**Purpose**: Provide server-side session data retrieval

**Interface**:
```typescript
GET /api/interview/session/[id]

Response:
{
  session: InterviewSession,
  firstQuestion: Question,
  route: InterviewRoute,
  studentName: string,
  firestoreInterviewId: string,
  scope: 'org' | 'user',
  orgId?: string
}
```

**Implementation**:
- Fetch interview record from Firestore using `id`
- Reconstruct session state from stored data
- Return initialization payload matching localStorage format
- Handle authentication/authorization
- Return 404 if interview not found or unauthorized

### 2. Enhanced InterviewRunner Component

**Changes**:
- Add URL parameter parsing for session data
- Add server-side data fetching with `/api/interview/session/[id]`
- Implement retry logic with exponential backoff
- Add better error states and user feedback
- Maintain backward compatibility with localStorage approach

**Loading Strategy**:
```typescript
async function loadSessionData(id: string) {
  // Layer 1: localStorage (instant)
  const localData = localStorage.getItem(`interview:init:${id}`)
  if (localData) return JSON.parse(localData)
  
  // Layer 2: URL parameters (fast)
  const urlData = parseURLSessionData()
  if (urlData) return urlData
  
  // Layer 3: Server fetch (slow but reliable)
  const response = await fetch(`/api/interview/session/${id}`)
  if (response.ok) {
    const serverData = await response.json()
    // Cache in localStorage for future use
    localStorage.setItem(`interview:init:${id}`, JSON.stringify(serverData))
    return serverData
  }
  
  // Layer 4: All failed
  throw new Error('Session data not available')
}
```

### 3. Session Initialization Components

**Files to Update**:
- `src/components/org/OrgInterviewSimulation.tsx`
- `src/components/student/StudentInterviewSimulation.tsx`
- `src/components/admin/InterviewSimulation.tsx`
- `src/app/student/page.tsx`

**Changes**:
- Keep localStorage write for fast path
- Add optional URL parameter encoding for medium path
- Ensure Firestore interview record is created BEFORE navigation
- Add navigation delay/confirmation to ensure data is written

## Data Models

### Interview Session Storage Schema

**Firestore Document** (`interviews/{id}`):
```typescript
{
  id: string
  userId: string
  orgId: string
  studentName: string
  route: InterviewRoute
  status: 'scheduled' | 'active' | 'analyzing' | 'completed'
  startTime: Timestamp
  endTime: Timestamp | null
  
  // Session state for reconstruction
  sessionState: {
    conversationHistory: Array<{
      question: string
      answer: string
      timestamp: string
      questionType: string
      difficulty: string
    }>
    currentQuestionIndex: number
    responses: Array<{
      question: string
      transcription: string
      timestamp: string
    }>
  }
  
  // First question for initialization
  firstQuestion: {
    question: string
    questionType: string
    difficulty: string
  }
  
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### URL Parameter Encoding (Optional Enhancement)

For cross-tab reliability, encode minimal session data in URL:

```
/interview/[id]?d=[base64-encoded-minimal-data]
```

Where minimal data includes:
- Session ID (redundant but validates)
- Route type
- Student name
- Timestamp (for cache validation)

## Error Handling

### Error States

1. **Session Not Found**
   - Message: "Interview session not found. It may have expired or been deleted."
   - Action: "Return to Dashboard" button
   - Log: Session ID, user ID, timestamp

2. **Permission Denied**
   - Message: "You don't have permission to access this interview."
   - Action: "Return to Dashboard" button
   - Log: Session ID, user ID, auth state

3. **Network Error**
   - Message: "Unable to load interview. Please check your connection."
   - Action: "Retry" and "Return to Dashboard" buttons
   - Log: Error details, retry count

4. **Data Corruption**
   - Message: "Interview data is corrupted. Please start a new interview."
   - Action: "Return to Dashboard" button
   - Log: Raw data, parse error

### Error Recovery

- Implement automatic retry with exponential backoff (3 attempts)
- Clear corrupted localStorage data automatically
- Provide manual retry button for network errors
- Log all errors to console with diagnostic context

## Testing Strategy

### Unit Tests

1. **InterviewRunner Data Loading**
   - Test localStorage success path
   - Test localStorage missing → server fetch
   - Test all data sources failing → error state
   - Test data parsing errors

2. **API Route**
   - Test successful session retrieval
   - Test session not found (404)
   - Test unauthorized access (403)
   - Test invalid session ID format

### Integration Tests

1. **End-to-End Flow**
   - Create interview from org dashboard
   - Navigate to interview page
   - Verify session loads correctly
   - Complete interview
   - Verify results saved

2. **Cross-Tab Scenarios**
   - Open interview in new tab
   - Open interview in new window
   - Open interview in incognito mode
   - Verify all scenarios work

### Manual Testing on Vercel

1. Deploy to Vercel preview environment
2. Test interview creation and navigation
3. Test with network throttling
4. Test with localStorage disabled
5. Test with multiple concurrent interviews
6. Verify error states display correctly

## Performance Considerations

### Optimization Strategies

1. **Fast Path Optimization**
   - Keep localStorage as primary method (fastest)
   - Only fetch from server if localStorage fails
   - Cache server responses in localStorage

2. **Server Fetch Optimization**
   - Use SWR or React Query for caching
   - Implement request deduplication
   - Add loading states to prevent user confusion

3. **Bundle Size**
   - Keep new API route minimal
   - Avoid adding heavy dependencies
   - Use dynamic imports if needed

### Monitoring

- Add timing metrics for each data loading layer
- Track which layer succeeds most often
- Monitor error rates by layer
- Alert on high server fetch rates (indicates localStorage issues)

## Security Considerations

1. **Authentication**
   - Verify user has access to interview session
   - Check org membership for org interviews
   - Validate student ownership for student interviews

2. **Data Exposure**
   - Don't expose sensitive data in URL parameters
   - Sanitize error messages (no internal IDs)
   - Rate limit API endpoint

3. **Session Hijacking**
   - Validate session hasn't expired
   - Check session status (can't load completed interviews)
   - Verify user matches session owner

## Migration Strategy

### Phase 1: Add Server Fallback (Non-Breaking)
- Implement new API route
- Add server fetch to InterviewRunner
- Keep localStorage as primary method
- Deploy and monitor

### Phase 2: Add URL Parameters (Optional)
- Implement URL parameter encoding
- Update navigation components
- Test cross-tab reliability
- Deploy if needed

### Phase 3: Optimize (Future)
- Analyze which layer is used most
- Optimize based on real-world data
- Consider removing unused layers

## Rollback Plan

If the fix causes issues:
1. Revert InterviewRunner changes
2. Keep API route (harmless)
3. Investigate root cause
4. Re-implement with additional safeguards

The localStorage-only approach will continue to work for most users, so the fix is additive and low-risk.
