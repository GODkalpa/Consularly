# Firestore Schema for Admin-Level Mock Interview System

## Collections Overview

### 1. Users Collection: `/users/{uid}`
Stores user profile information and role-based access control data.

**Fields:**
- `role`: string - User role ('user', 'admin', 'super_admin')
- `orgId`: string - Organization ID the user belongs to
- `email`: string - User's email address
- `displayName`: string - User's display name
- `createdAt`: timestamp - Account creation timestamp
- `updatedAt`: timestamp - Last profile update timestamp
- `isActive`: boolean - Account active status

**Example Document:**
```json
{
  "role": "user",
  "orgId": "org_123",
  "email": "student@example.com",
  "displayName": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "isActive": true
}
```

### 2. Interviews Collection: `/interviews/{interviewId}`
Stores mock interview session data and results.

**Fields:**
- `userId`: string - Reference to the user who took the interview
- `orgId`: string - Organization ID for multi-tenant support
- `startTime`: timestamp - Interview start time
- `endTime`: timestamp - Interview end time (null if ongoing)
- `status`: string - Interview status ('scheduled', 'in_progress', 'completed', 'cancelled')
- `score`: number - Overall interview score (0-100)
- `scoreDetails`: object - Detailed scoring breakdown
  - `communication`: number - Communication score (0-100)
  - `technical`: number - Technical skills score (0-100)
  - `confidence`: number - Confidence level score (0-100)
  - `overall`: number - Overall performance score (0-100)
- `interviewType`: string - Type of interview ('visa', 'job', 'academic')
- `duration`: number - Interview duration in minutes
- `createdAt`: timestamp - Record creation timestamp
- `updatedAt`: timestamp - Last update timestamp

**Example Document:**
```json
{
  "userId": "user_456",
  "orgId": "org_123",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T14:30:00Z",
  "status": "completed",
  "score": 85,
  "scoreDetails": {
    "communication": 88,
    "technical": 82,
    "confidence": 85,
    "overall": 85
  },
  "interviewType": "visa",
  "duration": 30,
  "createdAt": "2024-01-15T14:00:00Z",
  "updatedAt": "2024-01-15T14:35:00Z"
}
```

### 3. Interview Metrics Sub-collection: `/interviews/{interviewId}/metrics/{metricId}`
Stores detailed performance metrics for each interview session.

**Fields:**
- `eyeContactPct`: number - Percentage of time maintaining eye contact (0-100)
- `headPoseStd`: number - Standard deviation of head pose (lower is better)
- `wpm`: number - Words per minute speaking rate
- `fillerRate`: number - Filler words per minute
- `volumeLevel`: number - Average volume level (0-100)
- `pauseFrequency`: number - Number of pauses per minute
- `gestureCount`: number - Number of gestures detected
- `timestamp`: timestamp - When this metric was recorded
- `segmentStart`: number - Start time of this metric segment (seconds)
- `segmentEnd`: number - End time of this metric segment (seconds)

**Example Document:**
```json
{
  "eyeContactPct": 75,
  "headPoseStd": 12.5,
  "wpm": 145,
  "fillerRate": 2.3,
  "volumeLevel": 68,
  "pauseFrequency": 3.2,
  "gestureCount": 8,
  "timestamp": "2024-01-15T14:15:00Z",
  "segmentStart": 900,
  "segmentEnd": 1800
}
```

## Additional Collections for Complete System

### 4. Organizations Collection: `/organizations/{orgId}`
Stores organization information for multi-tenant support.

**Fields:**
- `name`: string - Organization name
- `domain`: string - Email domain for automatic user assignment
- `plan`: string - Subscription plan ('basic', 'premium', 'enterprise')
- `quotaLimit`: number - Monthly interview quota
- `quotaUsed`: number - Current month's interview count
- `adminUsers`: array - List of admin user IDs
- `settings`: object - Organization-specific settings
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 5. System Settings Collection: `/systemSettings/{settingId}`
Stores global platform configuration (admin-only access).

**Fields:**
- `key`: string - Setting key name
- `value`: any - Setting value
- `description`: string - Setting description
- `category`: string - Setting category
- `updatedBy`: string - Admin user who last updated
- `updatedAt`: timestamp

## Security Model

### Role-Based Access Control
- **user**: Can only access their own data
- **admin**: Can access all data within their organization
- **super_admin**: Can access all data across all organizations

### Data Access Patterns
1. **Students (role: 'user')**:
   - Read/write their own user profile
   - Read/write their own interviews
   - Read their own interview metrics
   - Cannot access other users' data

2. **Admins (role: 'admin')**:
   - Read/write all user profiles in their organization
   - Read/write all interviews in their organization
   - Read all interview metrics in their organization
   - Manage organization settings

3. **Super Admins (role: 'super_admin')**:
   - Full access to all collections
   - Manage system settings
   - Cross-organization access

## Indexes Required

### Composite Indexes
1. `interviews` collection:
   - `orgId` (ascending) + `startTime` (descending)
   - `userId` (ascending) + `startTime` (descending)
   - `status` (ascending) + `orgId` (ascending) + `startTime` (descending)

2. `users` collection:
   - `orgId` (ascending) + `role` (ascending)
   - `orgId` (ascending) + `createdAt` (descending)

### Single Field Indexes
- All timestamp fields for sorting
- `userId`, `orgId`, `role` for filtering
- `status` for interview filtering
