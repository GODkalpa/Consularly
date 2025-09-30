# Interview Quota Management System

## Overview
Implemented a comprehensive quota management system that allows super admin accounts to control how many interview simulations **both organizations AND individual signup users** can conduct. The system supports:
- **Organization quotas**: For company/institution accounts with multiple members
- **Individual user quotas**: For direct signup users without organization affiliation

## Features Implemented

### 1. **Database Schema Updates**
- **Location**: `src/types/firestore.ts`
- Added `quotaLimit` and `quotaUsed` fields to `UserProfile` interface for individual user quotas
- Organizations already had `quotaLimit` and `quotaUsed` fields in the schema

### 2. **API Endpoints**

#### Organization Quota Management
- **Endpoint**: `PATCH /api/admin/organizations/[id]`
- **Purpose**: Update organization quotas and settings
- **Features**:
  - Update `quotaLimit` (monthly interview limit)
  - Update `quotaUsed` (current usage count)
  - Update plan type (basic/premium/enterprise)
  - Update organization settings
- **Access**: Admin and super_admin only

#### User Quota Management
- **Endpoint**: `PATCH /api/admin/users/[id]`
- **Purpose**: Update individual user quotas (for signup users)
- **Features**:
  - Update `quotaLimit` (personal interview limit)
  - Update `quotaUsed` (current usage count)
  - Update role, active status, and display name
- **Access**: Admin and super_admin only

### 3. **Quota Enforcement**

#### Organization Interview Creation
- **Location**: `src/app/api/org/interviews/route.ts`
- **Purpose**: For organization member interviews
- **Logic**:
  1. Check organization's `quotaUsed` vs `quotaLimit` before creating interview
  2. Reject creation if quota exceeded (returns 403 with detailed error)
  3. Auto-increment organization's `quotaUsed` when interview is successfully created
  4. Thread-safe using Firestore's `FieldValue.increment()`

#### Signup User Interview Creation
- **Location**: `src/app/api/interview/session/route.ts` (enforced at session start)
- **Purpose**: For individual signup user interviews
- **Logic**:
  1. Verify user is NOT part of an organization (no orgId)
  2. Check user's personal `quotaUsed` vs `quotaLimit`
  3. Reject creation if quota exceeded (returns 403 with "Contact support for more interviews" message)
  4. Create interview document and auto-increment user's personal `quotaUsed` when interview is successfully created
  5. Thread-safe using Firestore's `FieldValue.increment()`
- **Note**: Legacy `/api/interviews` endpoint also validates quota but is no longer the primary path

### 4. **Admin Quota Management Dashboard**

#### Live Data Integration
- **Location**: `src/components/admin/QuotaManagement.tsx`
- **Features**:
  - Real-time Firestore subscription to organizations collection
  - Displays quota usage with visual progress bars
  - Color-coded status indicators:
    - **Green (Healthy)**: < 85% usage
    - **Orange (Warning)**: 85-94% usage
    - **Red (Critical)**: ≥ 95% usage
  - Search and filter organizations by status
  - Update quota limits via dialog
  - Reset quota usage to 0 with one click
  - Automatic calculations of platform-wide statistics

#### Tabs Structure
1. **Overview**: Platform statistics, usage trends, critical alerts
2. **Organizations**: Full quota management table with actions for org accounts
3. **Signup Users**: Individual user quota management table with actions
4. **Analytics**: Quota distribution charts
5. **Settings**: Global quota policies (UI ready, backend TBD)

#### Signup Users Tab
- Real-time list of all signup users (users without orgId or with quotaLimit set)
- Shows user name, email, quota usage, and status
- Edit quota limits for individual users
- Reset usage counts
- Same color-coded status system as organizations

### 5. **Dashboard Quota Overview**

#### Organization Dashboard
- **Location**: `src/components/org/OrganizationDashboard.tsx`
- **Features**:
  - Prominent "Quota Usage" card in Overview section
  - Shows current usage: "X / Y" with percentage
  - Visual quota usage progress bar with color-coding
  - Color-coded progress bar (green/orange/red based on usage)
  - **Critical Alert** (≥95% usage):
    - Red warning banner with icon
    - "Quota Limit Reached" message
    - Instructs users to contact administrator
  - **Warning Alert** (85-94% usage):
    - Orange warning banner with icon
    - "Approaching Quota Limit" message
    - Suggests requesting increase soon

#### Signup User Dashboard
- **Location**: `src/components/user/UserDashboard.tsx`
- **Features**:
  - Prominent "Interview Quota" card in Overview section
  - Large display of remaining interviews
  - Shows usage: "X / Y Used"
  - Visual progress bar with color-coding
  - **No Quota Alert** (quotaLimit = 0):
    - Red warning banner
    - "No Quota Assigned" message
    - Directs user to contact support
  - **Critical Alert** (≥95% usage):
    - Red warning banner
    - "Quota Almost Exhausted" message
  - **Warning Alert** (85-94% usage):
    - Orange warning banner
    - Shows exact remaining count

#### Interview Creation Feedback
- **Location**: `src/components/org/OrgInterviewSimulation.tsx`, `src/components/user/UserInterviewSimulation.tsx`, and `src/components/admin/InterviewSimulation.tsx`
- **Features**:
  - **Center-screen modal dialog** (AlertDialog) when quota exceeded instead of small toast notification
  - Graceful error handling with user-friendly messages: "Contact support for more interviews"
  - Modal blocks further interaction until user acknowledges with "OK" button
  - Prevents interview creation attempt when quota reached
  - Auth token passed to API for quota validation

## User Flows

### Admin Flow
1. Navigate to Admin Dashboard → **Quota Management**
2. View real-time quota usage across all organizations
3. Filter by status (healthy/warning/critical) or search by name
4. Click **Edit** icon or **Increase Quota** button on any organization
5. Enter new quota limit in dialog
6. Click **Update Quota** to save changes
7. Organization can immediately conduct more interviews

### Organization User Flow
1. Navigate to Org Dashboard → **Overview**
2. View "Quota Usage" card showing current usage
3. See visual warnings when approaching limit (85%+)
4. Attempt to start interview simulation
5. If quota exceeded:
   - Toast error appears: "Quota Limit Reached"
   - Interview creation is blocked
   - User is instructed to contact administrator

### Quota Reset Flow
1. Admin can reset any organization's `quotaUsed` to 0
2. Click **Reset** icon (RefreshCw) in the Actions column
3. Quota usage resets immediately (real-time update)
4. Organization can conduct interviews again up to their limit

## Technical Details

### Real-time Updates
- Uses Firestore `onSnapshot` for live data synchronization
- All quota changes propagate instantly to admin dashboard
- No page refresh required to see updates

### Quota Increment
- Atomic operation using `FieldValue.increment(1)`
- Thread-safe and handles concurrent interview creations
- No race conditions or quota overruns

### Error Handling
- API returns descriptive error messages
- UI displays toast notifications for all quota-related errors
- Graceful degradation if Firebase is not enabled

### Security
- All endpoints verify Firebase ID tokens
- Role-based access control (admin/super_admin only)
- Organization-scoped data access enforced

## Future Enhancements

### Potential Features
1. **User-level quotas**: Individual limits for signup users (schema ready, enforcement TBD)
2. **Automatic quota resets**: Monthly/weekly automatic reset based on billing cycle
3. **Quota history**: Track quota changes over time
4. **Email notifications**: Alert admins when organizations reach 85%/95%
5. **Quota overage**: Allow temporary overage with approval workflow
6. **Bulk quota updates**: Update multiple organizations at once
7. **Plan-based quotas**: Auto-assign quotas based on subscription plan

## Configuration

### Setting Initial Quotas
When creating a new organization via `POST /api/admin/organizations`:
```json
{
  "name": "Example Org",
  "plan": "premium",
  "quotaLimit": 500,
  "quotaUsed": 0
}
```

### Updating Quotas
To increase an organization's quota via `PATCH /api/admin/organizations/[id]`:
```json
{
  "quotaLimit": 1000
}
```

### Resetting Usage
To reset quota usage via `PATCH /api/admin/organizations/[id]`:
```json
{
  "quotaUsed": 0
}
```

## Testing Scenarios

### Test Quota Enforcement
1. Create organization with `quotaLimit: 5`
2. Create 5 interviews successfully
3. Attempt 6th interview → should fail with quota error
4. Admin increases quota to 10
5. Create 6th interview → should succeed

### Test Warning Thresholds
1. Organization with `quotaLimit: 100`
2. Set `quotaUsed: 84` → No warning
3. Set `quotaUsed: 85` → Orange warning appears
4. Set `quotaUsed: 95` → Red critical alert appears

### Test Real-time Updates
1. Open Quota Management in admin dashboard
2. Update quota in another browser/tab via API
3. Verify dashboard updates without refresh
4. Check organization dashboard also reflects change

## Notes
- Quotas are enforced for both organizations and individual signup users
- Signup users without `quotaLimit` set will have a default limit of 0 (cannot create interviews until admin assigns quota)
- Monthly reset functionality UI is present but backend automation not yet implemented
- All quota operations are logged implicitly through Firestore's `updatedAt` timestamps
- Quota checks happen server-side, not client-side (security best practice)
- Auth tokens are required for quota validation in `/api/interview/session`
