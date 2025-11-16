# Interview Status and Results Display Fix

## Issues Identified

### 1. Interview Status Stuck at "In Progress"
**Problem**: When users end an interview (either by completing all questions or ending early), the interview status remains as "in_progress" instead of being updated to "completed".

**Root Cause**: 
- Interview status is set to `in_progress` when the interview starts
- When the interview completes, the status is updated to `completed` in the InterviewRunner component
- However, the update might fail or not be triggered in certain edge cases (network issues, early termination, etc.)

### 2. Dashboard Not Showing Results
**Problem**: The organization dashboard shows interviews with "Interview data not available" even though the interview was completed.

**Root Cause**:
- The dashboard API queries for interviews with `finalScore >= 0` to calculate average scores
- However, the interview update endpoints only set the `score` field, not `finalScore`
- This mismatch causes completed interviews to not appear in dashboard statistics

### 3. Results Display Inconsistency
**Problem**: Interview results are stored but not displayed correctly in both org and student dashboards.

**Root Cause**:
- Results are stored in the `finalReport` field
- Dashboard displays use the `score` field
- Missing synchronization between these two fields

## Fixes Applied

### 1. Added `finalScore` Field to Interview Updates

**Files Modified**:
- `src/components/interview/InterviewRunner.tsx`
- `src/app/api/org/interviews/[id]/route.ts`
- `src/app/api/interviews/[id]/route.ts`

**Changes**:
```typescript
// Before
if (typeof score === 'number') {
  body.score = score
}

// After
if (typeof score === 'number') {
  body.score = score
  body.finalScore = score // CRITICAL FIX: Set finalScore for dashboard queries
}
```

This ensures that whenever a score is set, the `finalScore` field is also updated, making the interview visible in dashboard queries.

### 2. Updated Firestore Schema

**File Modified**: `firestore-schema.ts`

**Changes**:
- Added `finalScore?: number` field to Interview interface
- Added `failed` status to interview status enum
- Added `failureReason?: string` field for tracking why interviews failed

### 3. Created Cleanup Script

**File Created**: `scripts/fix-stuck-interviews.ts`

This script:
1. Finds all interviews with `status = 'in_progress'`
2. Checks if they have a `finalReport` (meaning they were completed)
3. Updates their status to `completed` and sets `finalScore` if missing
4. Marks abandoned interviews (>2 hours old with no finalReport) as `failed`

**Usage**:
```bash
npm run interview:fix
```

## How Results Are Stored and Displayed

### Storage Flow

1. **During Interview**:
   - Status: `scheduled` → `in_progress`
   - Per-answer scores stored in `perAnswerScores` array
   - Conversation history stored in `conversationHistory` array

2. **On Completion**:
   - Status: `in_progress` → `completed`
   - Final report generated and stored in `finalReport` object
   - Overall score stored in both `score` and `finalScore` fields
   - Score details stored in `scoreDetails` object

### Display Flow

#### Organization Dashboard (`src/components/org/OrganizationDashboard.tsx`)

1. **Overview Section**:
   - Fetches statistics from `/api/org/dashboard`
   - Shows total interviews, average score, recent activity
   - Uses `finalScore` field for score calculations

2. **Recent Activity**:
   - Displays last 5 interviews
   - Shows candidate name, score, and status
   - Status badge colors:
     - Green: `completed`
     - Orange: `in_progress`
     - Red: `failed`

3. **Results Section** (`src/components/org/OrgStudentResults.tsx`):
   - Lists all interviews with detailed information
   - Expandable rows show full `finalReport` data
   - Displays:
     - Decision (accepted/rejected/borderline)
     - Overall score
     - Dimension scores
     - Detailed insights
     - Strengths and weaknesses

#### Student Dashboard (`src/app/student/page.tsx`)

1. **Overview Section**:
   - Shows total interviews, completed count, average score
   - Uses `score` field for calculations

2. **Recent Activity**:
   - Displays last 3 interviews
   - Shows interview type, score, and date

3. **Results Section** (`src/components/student/StudentResults.tsx`):
   - Lists all student's interviews
   - Shows status, score, and route
   - Expandable rows show full report details

## Data Flow Diagram

```
Interview Start
    ↓
status: 'scheduled'
    ↓
User Starts Interview
    ↓
status: 'in_progress'
    ↓
User Answers Questions
    ↓
perAnswerScores[] populated
conversationHistory[] populated
    ↓
Interview Completes
    ↓
Final Report Generated
    ↓
PATCH /api/org/interviews/[id] or /api/interviews/[id]
    ↓
Updates:
  - status: 'completed'
  - score: X
  - finalScore: X  ← CRITICAL FIX
  - finalReport: {...}
  - scoreDetails: {...}
    ↓
Dashboard Queries
    ↓
WHERE finalScore >= 0  ← Now works correctly
    ↓
Results Displayed
```

## Testing the Fix

### 1. Test New Interviews

1. Start a new interview
2. Complete all questions or end early
3. Verify status changes to "completed"
4. Check dashboard shows the interview with correct score
5. Verify results are displayed in both org and student dashboards

### 2. Fix Existing Stuck Interviews

1. Run the cleanup script:
   ```bash
   npm run interview:fix
   ```

2. Check the output to see how many interviews were fixed

3. Refresh the dashboard to see updated results

### 3. Verify Dashboard Display

1. **Organization Dashboard**:
   - Go to Overview → Check "Recent Activity" section
   - Go to Results → Verify all completed interviews are listed
   - Click on an interview → Verify full report is displayed

2. **Student Dashboard**:
   - Go to Overview → Check "Recent Activity" section
   - Go to Results → Verify all interviews are listed
   - Click on an interview → Verify report details are shown

## Prevention

To prevent this issue in the future:

1. **Always set both `score` and `finalScore`** when updating interview results
2. **Use the cleanup script periodically** to catch any stuck interviews
3. **Monitor interview status** in production to detect issues early
4. **Add error handling** for interview completion to ensure status is always updated

## Related Files

- `src/components/interview/InterviewRunner.tsx` - Main interview component
- `src/app/api/org/interviews/[id]/route.ts` - Org interview update endpoint
- `src/app/api/interviews/[id]/route.ts` - User interview update endpoint
- `src/app/api/org/dashboard/route.ts` - Dashboard data endpoint
- `src/components/org/OrganizationDashboard.tsx` - Org dashboard UI
- `src/components/org/OrgStudentResults.tsx` - Org results display
- `src/app/student/page.tsx` - Student dashboard UI
- `src/components/student/StudentResults.tsx` - Student results display
- `firestore-schema.ts` - Database schema definitions
- `scripts/fix-stuck-interviews.ts` - Cleanup script

## Notes

- The `finalScore` field is specifically used by dashboard queries for performance optimization
- The `score` field is the primary score field used throughout the application
- Both fields should always be kept in sync
- The cleanup script is safe to run multiple times and will only update interviews that need fixing
