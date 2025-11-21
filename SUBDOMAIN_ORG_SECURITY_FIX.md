# Subdomain Organization Security Fix

## Problem
Users could log in to any subdomain with credentials from a different organization. For example:
- User has credentials for "Consulary" organization
- User visits "sumedha-education.consulary.com" subdomain
- User successfully logs in with Consulary credentials
- User gains access to Sumedha Education's dashboard ❌

This was a critical security vulnerability allowing cross-organization access.

## Root Cause
The authentication flow had two stages:
1. **Login** - Firebase authentication (validated credentials only)
2. **Middleware** - Organization access check (happened AFTER login)

The problem: Session cookies were set during login, before the middleware could validate organization access.

## Solution
Added organization validation **during the login process** before setting session cookies:

### 1. Enhanced Session API (`/api/auth/session`)
- Detects if user is logging in from a subdomain
- Looks up the organization by subdomain
- Validates user belongs to that organization (checks `users.orgId` or `orgStudents.orgId`)
- **Only sets session cookies if validation passes**
- Returns 403 error if user doesn't belong to the organization

### 2. Updated Authentication Flow
- `AuthActionsContext.tsx` - Throws error if session creation fails
- `signin/page.tsx` - Signs out user and shows error message if org validation fails
- Middleware - Redirects to access-denied page if somehow a user gets through

### 3. Enhanced Access Denied Page
- Shows specific message for organization mismatch
- Explains that each org has its own subdomain
- Guides users to sign in with correct credentials

### 4. Cookie Management
Added additional cookies for better validation:
- `s` - Session flag (1 = authenticated, 0 = not authenticated)
- `uid` - User ID for quick lookup
- `role` - User role (admin, org, student)
- `orgId` - User's organization ID

All cookies are cleared on logout or access denial.

## Security Flow (After Fix)

### Subdomain Login Flow
1. User visits `sumedha-education.consulary.com`
2. User enters credentials
3. Firebase validates credentials ✓
4. Session API checks:
   - Is this a subdomain? ✓
   - Which org owns this subdomain? → "sumedha-org-id"
   - Does user belong to this org? → Check `users.orgId` or `orgStudents.orgId`
   - If NO → Return 403, sign out user, show error ❌
   - If YES → Set session cookies, allow access ✓

### Middleware Protection (Backup)
Even if session cookies are somehow set, middleware validates:
- User's orgId matches subdomain's orgId
- If mismatch → Clear cookies, redirect to access-denied

## Testing
To verify the fix works:

1. **Test Cross-Org Login (Should Fail)**
   ```
   1. Visit sumedha-education.consulary.com
   2. Try to log in with Consulary org credentials
   3. Should see error: "You do not have access to this organization"
   4. Should be signed out automatically
   ```

2. **Test Correct Org Login (Should Work)**
   ```
   1. Visit sumedha-education.consulary.com
   2. Log in with Sumedha Education credentials
   3. Should successfully access dashboard
   ```

3. **Test Platform Admin (Should Work)**
   ```
   1. Visit any subdomain
   2. Log in with platform admin credentials
   3. Should access any organization (admins have universal access)
   ```

## Files Modified
- `src/app/api/auth/session/route.ts` - Added org validation
- `src/contexts/AuthActionsContext.tsx` - Handle session creation errors
- `src/app/signin/page.tsx` - Handle org access errors
- `middleware.ts` - Enhanced cookie clearing on access denial
- `src/app/access-denied/page.tsx` - Better error messaging

## Environment Variables Required
- `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true` - Must be enabled for subdomain validation

## Notes
- Platform admins (role='admin') can access any organization
- Students are validated via `orgStudents` collection
- Org users are validated via `users.orgId` field
- All validation happens server-side for security
