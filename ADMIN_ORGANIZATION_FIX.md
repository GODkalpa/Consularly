# Admin & Organization Management Fix

## Problem Summary
Organizations created by regular admins were not appearing in the admin dashboard, even though the API returned success.

## Root Cause
The system had conflicting logic between how admin users should be managed:
1. **Old behavior**: Admins were assigned to organizations via `orgId` field
2. **New requirement**: Admins should be system-wide (no `orgId`)
3. **Issue**: Firestore rules still checked `orgId` to determine organization access

## Complete Solution

### 1. ✅ User Creation API (`/api/admin/users/route.ts`)
**Changed**: Admin/super_admin users are never assigned `orgId`
```typescript
// Admin users should NOT have an orgId - they are system-wide
if (role === 'admin' || role === 'super_admin') {
  orgId = '' // Clear orgId for admin users
}
```

### 2. ✅ Organization Creation API (`/api/admin/organizations/route.ts`)
**Changed**: Creator is added to `adminUsers` array during org creation
```typescript
// Add the creator to adminUsers array so they can see the organization
const adminUsers = callerRole === 'admin' ? [callerUid] : []

const organizationDoc = {
  // ... other fields
  adminUsers, // Include creator for access control
}
```

### 3. ✅ Firestore Security Rules (`firestore.rules`)
**Changed**: Organizations use `adminUsers` array instead of `orgId` for admin access
```javascript
// Regular admins can read organizations where they are listed in adminUsers array
allow read: if request.auth != null && 
  exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
  request.auth.uid in resource.data.adminUsers;
```

### 4. ✅ Organization Management UI (`OrganizationManagement.tsx`)
**Changed**: User count excludes admin users
```typescript
// Count only non-admin users (organization members and students)
const nonAdminCount = usersSnap.docs.filter(doc => {
  const role = doc.data()?.role
  return role !== 'admin' && role !== 'super_admin'
}).length
```

### 5. ✅ Organization Delete API (`/api/admin/organizations/[id]/route.ts`)
**Changed**: Delete validation excludes admin users from user count
```typescript
// Check if organization has users (excluding admin users)
const nonAdminUsers = usersSnap.docs.filter(doc => {
  const role = doc.data()?.role
  return role !== 'admin' && role !== 'super_admin'
})
```

## How It Works Now

### Admin Users
- ✅ **No `orgId` assigned** - Admins are system-wide
- ✅ **Can manage multiple organizations** via `adminUsers` array
- ✅ **Show "-" in Organization column** in user list
- ✅ **Not counted as organization users** for deletion validation

### Organization Access
- **Super Admins**: See all organizations
- **Regular Admins**: See only organizations where they are in `adminUsers` array
- **Query Logic**:
  ```typescript
  if (isSuper) {
    // Show all organizations
    q = query(baseCol, orderBy('createdAt', 'desc'))
  } else if (user?.uid) {
    // Show organizations where admin is listed in adminUsers
    q = query(baseCol, where('adminUsers', 'array-contains', user.uid))
  }
  ```

### Organization Creation
1. Admin creates organization via API
2. API adds admin's UID to `adminUsers` array
3. Organization document created in Firestore
4. Firestore rules allow admin to read (because they're in `adminUsers`)
5. Real-time listener picks up the new organization
6. Organization appears in admin's dashboard

## Testing Checklist

- [x] Create organization as regular admin → Should appear immediately
- [x] Admin user shows "-" in Organization column
- [x] Organization shows 0 users (admins excluded from count)
- [x] Can edit organization
- [x] Can delete organization (only if no non-admin users)
- [x] Newly created admin users have no `orgId`
- [x] Firestore rules deployed and active

## Cleanup Required

For existing admin users that have `orgId` set from before the fix, run:
```bash
npx ts-node scripts/cleanup-admin-orgs.ts
```

This will:
- Find all admin/super_admin users
- Remove their `orgId` field
- Update their `updatedAt` timestamp

## Key Concepts

### Admin Users vs Organization Members
| Type | Has orgId? | Counted in Org Users? | Access Scope |
|------|-----------|---------------------|--------------|
| **Admin** | ❌ No | ❌ No | Multiple orgs via `adminUsers` |
| **Organization Member** | ✅ Yes | ✅ Yes | Single org only |
| **Student** | ❌ No | ❌ No | Own interviews only |

### adminUsers Array
- **Purpose**: Track which admins can manage which organizations
- **Type**: Array of user UIDs
- **Used by**: Firestore rules for read/write access
- **Updated**: During org creation, or manually by super admin
