# Sign-Up and Profile Setup Permissions Fix

## Problem

Users were unable to complete the signup and profile setup flow, receiving permissions errors:
1. **Sign-Up Page** (`/signup`): "Missing or insufficient permissions" when creating account
2. **Profile Setup Page** (`/profile-setup`): "Failed to save setup - Missing or insufficient permissions" when selecting interview country

## Root Cause

**Race condition between Firebase Authentication and Firestore security rules.**

The original signup flow in `AuthContext.tsx`:
1. Created Firebase Auth user with `createUserWithEmailAndPassword()`
2. **Immediately** tried to write user document to Firestore with `setDoc()`

The issue: The Firebase Auth ID token hadn't fully propagated to the Firestore SDK yet, causing the security rule check to fail:

```firestore
// Line 9 of firestore.rules
allow read, write: if request.auth != null && request.auth.uid == userId;
```

Even though the user was authenticated, the `request.auth` context wasn't available yet for the Firestore write operation.

## Solution

**Server-side user creation using Firebase Admin SDK**, which bypasses security rules.

### Changes Made

#### 1. Created `/api/auth/signup` API Route
**File**: `src/app/api/auth/signup/route.ts`

- Uses Firebase Admin SDK to create both Auth user and Firestore document
- Bypasses client-side security rules entirely
- Validates input server-side
- Handles Firebase Auth error codes gracefully
- Sets default values (role: 'user', quotaLimit: 10, etc.)

#### 2. Created `/api/profile/setup` API Route
**File**: `src/app/api/profile/setup/route.ts`

- Uses Firebase Admin SDK to update user profile with interview country and student profile
- Requires ID token authentication
- Validates interview country (usa, uk, france)
- Only saves student profile for USA interviews
- Bypasses security rules for newly created users

#### 3. Updated AuthContext Sign-Up Flow
**File**: `src/contexts/AuthContext.tsx`

- Removed direct client-side Firestore writes
- Calls `/api/auth/signup` API endpoint instead
- Signs in the user after successful account creation
- Sends welcome email asynchronously

#### 4. Updated Profile Setup Page
**File**: `src/app/profile-setup/page.tsx`

- Removed client-side `updateUserProfile()` and `updateStudentProfile()` calls
- Calls `/api/profile/setup` API endpoint with ID token authentication
- Handles API errors gracefully with toast notifications

#### 5. Cleaned Up Unused Imports
- Removed `createUserWithEmailAndPassword` from AuthContext (not needed in client anymore)
- Removed `updateProfile` from AuthContext (handled server-side)
- Removed `sendPasswordResetEmail` from signup flow
- Removed `updateUserProfile` and `updateStudentProfile` from profile setup page

## Benefits

1. **Eliminates race condition** - Server-side operations are atomic
2. **Better error handling** - Consistent error messages from API
3. **Security** - User creation logic centralized on server
4. **Reliability** - No timing issues with auth token propagation
5. **Consistent with admin flow** - Uses same pattern as `/api/admin/users`

## Testing

To verify the complete fix:

### Sign-Up Flow
1. Navigate to `/signup`
2. Fill in Full Name, Email, Password, Confirm Password
3. Click "Create account"
4. Should successfully create account and redirect to `/profile-setup`
5. No "Missing or insufficient permissions" error

### Profile Setup Flow
1. After successful signup, you'll land on `/profile-setup`
2. Select an interview country (USA, UK, or France)
3. If USA: Fill in university, degree, major, GPA (optional)
4. Click "Complete Setup" or "Save and Continue"
5. Should successfully save and redirect to `/dashboard`
6. No "Failed to save setup" error

### End-to-End Test
1. Complete signup → Profile setup → Dashboard navigation
2. All steps should complete without permissions errors
3. User profile should be properly saved in Firestore

## Related Files

- `src/app/api/auth/signup/route.ts` - New signup API endpoint
- `src/app/api/profile/setup/route.ts` - New profile setup API endpoint
- `src/contexts/AuthContext.tsx` - Updated signup logic
- `src/app/profile-setup/page.tsx` - Updated profile setup logic
- `firestore.rules` - Security rules (unchanged)
- `src/lib/firebase-admin.ts` - Firebase Admin SDK initialization

## Environment Variables Required

Server-side Firebase Admin needs one of:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- OR `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
- OR service account file in project root: `service-account-key.json`

Client-side Firebase needs:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Notes

- Google Sign-In still uses client-side flow (may need similar fix if issues arise)
- Security rules remain unchanged - they work correctly for authenticated operations
- The fix follows the same pattern used for admin user creation
