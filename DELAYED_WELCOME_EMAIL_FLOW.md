# Delayed Welcome Email Flow

## Overview
Implemented a better user experience where welcome emails are sent **after** users set their password, not immediately when the admin creates their account.

## Problem
Previously, when an admin created an organization user:
1. ✉️ Password reset email sent → ✅ Good
2. ✉️ Organization welcome email sent immediately → ❌ Bad (user hasn't even logged in yet!)

Users received a welcome email before they could even access the platform.

## Solution
New flow provides a better UX:
1. **Admin creates org user** → Password reset email sent
2. **User sets password** → User logs in for first time
3. **On first login** → Welcome email sent automatically ✨

---

## Implementation

### 1. User Document Tracking
**Files Updated:**
- `src/app/api/admin/organizations/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/types/firestore.ts`
- `src/lib/database.ts`

**New Fields Added to User Documents:**
```typescript
{
  passwordSet: false,        // Tracks if user has set their password
  welcomeEmailSent: false,   // Tracks if welcome email has been sent
}
```

These fields are set to `false` when admin creates a user account.

### 2. Removed Immediate Welcome Email
**File:** `src/app/api/admin/organizations/route.ts`

**Before:**
```typescript
// Send account creation email
await sendAccountCreationEmail(...)

// Send org welcome email immediately ❌
await sendOrgWelcomeEmail(...)
```

**After:**
```typescript
// Send password reset email only ✅
await sendPasswordResetEmail(...)

// Welcome email will be sent on first login
```

### 3. Welcome Email API Endpoint
**File:** `src/app/api/auth/send-welcome/route.ts`

**Endpoint:** `POST /api/auth/send-welcome`

**Features:**
- ✅ Requires authentication (user must be logged in)
- ✅ Checks if welcome email already sent (prevents duplicates)
- ✅ Fetches organization details for branding
- ✅ Sends org-specific welcome email
- ✅ Updates user document (marks `welcomeEmailSent: true` and `passwordSet: true`)
- ✅ Handles non-org users gracefully

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully"
}
```

### 4. AuthContext Integration
**File:** `src/contexts/AuthContext.tsx`

**Logic Added:**
```typescript
// In onSnapshot callback (line 88)
if (latest && latest.orgId && !latest.welcomeEmailSent) {
  // First login detected - send welcome email
  user.getIdToken().then((token) => {
    fetch('/api/auth/send-welcome', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  })
}
```

**Triggers When:**
- User has an `orgId` (belongs to organization)
- `welcomeEmailSent` is `false`
- User successfully logs in

**Non-Blocking:**
- Runs asynchronously
- Doesn't block user experience
- Logs success/failure to console

---

## Complete User Flow

### Scenario: Admin Creates Organization User

#### Step 1: Admin Creates Account
**Admin Dashboard** → Create Organization → Add User

**API:** `POST /api/admin/organizations`

**What Happens:**
```
1. Create Firebase Auth user (no password)
2. Create Firestore user document:
   {
     email: "user@org.com",
     displayName: "John Doe",
     role: "user",
     orgId: "org123",
     passwordSet: false,        ← Tracking field
     welcomeEmailSent: false,   ← Tracking field
   }
3. Generate password reset link
4. Send password reset email ✉️
```

**User Receives:**
```
Subject: Reset Your Password
Body: Click here to set up your account password...
```

#### Step 2: User Sets Password
**User clicks link** → Firebase password reset page → Sets new password

**What Happens:**
```
1. Firebase validates reset link
2. User creates password
3. User is redirected to sign-in page
```

#### Step 3: User Logs In
**User enters credentials** → Signs in

**AuthContext Detects:**
```typescript
// Check: User has orgId? ✅
// Check: welcomeEmailSent is false? ✅
// Action: Call /api/auth/send-welcome
```

**API:** `POST /api/auth/send-welcome`

**What Happens:**
```
1. Verify user authentication
2. Fetch user profile from Firestore
3. Check if welcomeEmailSent is false
4. Fetch organization details (name, plan, quota)
5. Send org welcome email ✉️
6. Update user document:
   {
     passwordSet: true,
     welcomeEmailSent: true,
   }
```

**User Receives:**
```
Subject: Welcome to Consularly - [Org Name] is All Set! 🚀
Body: Congratulations! Your account is ready...
       [Quick start guide, features, etc.]
```

#### Step 4: Subsequent Logins
**User logs in again**

**AuthContext Checks:**
```typescript
// Check: welcomeEmailSent is true? ✅
// Action: Skip email sending
```

No duplicate emails sent! ✅

---

## Benefits

### Better User Experience
- ✅ Users receive welcome email **after** they can actually use the platform
- ✅ No confusing emails before password is set
- ✅ Proper onboarding sequence
- ✅ Welcome message makes sense (user has already logged in)

### Cleaner Flow
- ✅ One email at account creation (password reset)
- ✅ One email on first login (welcome)
- ✅ No spam or duplicate emails
- ✅ Clear separation of concerns

### Technical Advantages
- ✅ Tracking fields prevent duplicate sends
- ✅ Non-blocking implementation (doesn't slow down login)
- ✅ Handles edge cases (non-org users, already sent)
- ✅ Automatic retry on subsequent logins if email fails
- ✅ Console logging for debugging

---

## Testing

### Test Scenario 1: New Org User
1. **Admin creates organization with user email**
   - ✅ Check: Password reset email received
   - ✅ Check: No welcome email received yet

2. **User clicks reset link and sets password**
   - ✅ Check: Password successfully set

3. **User signs in for first time**
   - ✅ Check: Console shows "First login detected, sending welcome email"
   - ✅ Check: Welcome email received
   - ✅ Check: Firestore user document has `welcomeEmailSent: true`

4. **User signs in again**
   - ✅ Check: No duplicate welcome email
   - ✅ Check: Console doesn't show welcome email trigger

### Test Scenario 2: Admin Creates User via User Management
1. **Admin creates user with orgId**
   - ✅ Check: Account creation email received (with reset link)

2. **User sets password and logs in**
   - ✅ Check: Welcome email sent on first login

### Test Scenario 3: Non-Org User
1. **Admin creates user without orgId (system admin)**
   - ✅ Check: Password reset email received

2. **User logs in**
   - ✅ Check: No welcome email sent (not part of org)
   - ✅ Check: `welcomeEmailSent` set to `true` in Firestore

### Console Logs to Check
```
[AuthContext] First login detected, sending welcome email
[send-welcome] Organization welcome email sent to: user@org.com
[AuthContext] Welcome email sent successfully
```

---

## Edge Cases Handled

### 1. Email Service Failure
**What happens:** API call to `/api/auth/send-welcome` fails

**Handling:**
- ✅ Error logged to console
- ✅ User experience not affected (non-blocking)
- ✅ Email will retry on next login (since `welcomeEmailSent` is still `false`)

### 2. Duplicate Sends
**What happens:** User logs in multiple times quickly

**Handling:**
- ✅ API checks `welcomeEmailSent` field
- ✅ Returns success but doesn't send duplicate
- ✅ Idempotent operation

### 3. Org Not Found
**What happens:** User has `orgId` but org document is missing

**Handling:**
- ✅ API returns 404 error
- ✅ Error logged to console
- ✅ User can still access platform

### 4. Non-Org Users
**What happens:** User doesn't have `orgId` (system admin, personal user)

**Handling:**
- ✅ AuthContext checks `orgId` exists before sending
- ✅ No welcome email sent
- ✅ Fields marked as complete in Firestore

---

## Migration Notes

### Existing Users
Users created **before** this update:
- Won't have `passwordSet` or `welcomeEmailSent` fields
- Fields are optional (`?:`) in TypeScript interfaces
- AuthContext treats `undefined` as `false` → will send welcome email on next login

### Data Migration (Optional)
If you want to prevent welcome emails for existing users:

```typescript
// Run this script once to mark all existing users as welcomed
const usersRef = adminDb().collection('users');
const batch = adminDb().batch();

const snapshot = await usersRef.get();
snapshot.docs.forEach((doc) => {
  batch.update(doc.ref, {
    passwordSet: true,
    welcomeEmailSent: true,
  });
});

await batch.commit();
```

---

## Files Modified

### API Routes
- ✅ `src/app/api/admin/organizations/route.ts` - Removed immediate welcome email
- ✅ `src/app/api/admin/users/route.ts` - Added tracking fields
- ✅ `src/app/api/auth/send-welcome/route.ts` - **New endpoint**

### Types
- ✅ `src/types/firestore.ts` - Added `passwordSet`, `welcomeEmailSent` to UserProfile
- ✅ `src/lib/database.ts` - Added `passwordSet`, `welcomeEmailSent` to UserProfile

### Context
- ✅ `src/contexts/AuthContext.tsx` - Added first-login welcome email trigger

---

## Environment Variables

No new environment variables required! Uses existing:
- `BREVO_API_KEY` - For sending emails
- `NEXT_PUBLIC_APP_URL` - For email links

---

## Future Enhancements

### Potential Improvements
- [ ] Add email preview in admin dashboard
- [ ] Allow admins to manually trigger welcome email
- [ ] Track email open rates via Brevo webhooks
- [ ] Add custom welcome message per organization
- [ ] Support multiple welcome email templates
- [ ] Add welcome email scheduling (delay by X hours)

---

**Implemented:** November 7, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
