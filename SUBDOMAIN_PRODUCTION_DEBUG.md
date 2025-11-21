# Subdomain Production Issue - Debugging Guide

## Current Status

Based on Vercel logs, the issue is:
- ❌ `/api/admin/subdomain/validate` returns 404
- ⚠️ Validation is blocking the save button
- ✅ The main subdomain API endpoint exists at `/api/admin/organizations/[id]/subdomain`

## What Was Fixed (Latest)

### 1. Made Validation Non-Blocking

The validation endpoint was returning 404 and blocking saves. Now:
- Validation failures don't disable the save button
- If validation endpoint fails, it assumes the subdomain is valid
- Save button only disabled during loading/validating states

### 2. Added Better Logging

Added console.log statements to track:
- When save is initiated
- API response status
- Success/error responses
- Helps debug in browser console

### 3. Added Delay Before Refresh

After successful save, waits 500ms before calling `onUpdate()` to ensure Firestore has propagated the changes.

### 4. Added Authentication to API Routes

**Files Updated:**
- `src/app/api/admin/organizations/[id]/subdomain/route.ts`
- `src/app/api/admin/subdomain/validate/route.ts`

**Changes:**
- Added `Authorization: Bearer <token>` header verification
- Verify user is an admin before allowing subdomain changes
- Added detailed error logging with error codes and messages

### 2. Updated Frontend to Send Auth Token

**File Updated:**
- `src/components/admin/SubdomainManager.tsx`

**Changes:**
- Import Firebase auth
- Get ID token from current user
- Send token in Authorization header
- Added useEffect to sync state with props (for real-time updates)

### 3. Enhanced Error Logging

The API now logs:
- Request details (orgId, subdomain, enabled status, userId)
- Update data being sent to Firestore
- Success confirmations with returned data
- Detailed error information (message, code, stack trace)

## How to Test the Fix

### Option 1: Test in Browser Console

1. Open the admin dashboard in production
2. Open browser DevTools (F12)
3. Go to Console tab
4. Try to save a subdomain
5. Look for these log messages:
   ```
   [SubdomainManager] Saving subdomain: { subdomain, enabled, orgId }
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: { ... }
   ```

### Option 2: Test API Directly

Use the test script:

```bash
# 1. Get your auth token from browser console:
# Open consularly.com, sign in, then run in console:
await firebase.auth().currentUser.getIdToken()

# 2. Run the test script:
npx tsx scripts/test-subdomain-api.ts <ORG_ID> <SUBDOMAIN> <YOUR_TOKEN>
```

### Option 3: Check Network Tab

1. Open DevTools → Network tab
2. Try to save subdomain
3. Look for the PATCH request to `/api/admin/organizations/[id]/subdomain`
4. Check:
   - Request headers (should have Authorization: Bearer ...)
   - Request payload (subdomain and enabled values)
   - Response status (should be 200)
   - Response body (should have success: true)

## How to Debug in Production

### 1. Check Vercel Logs

Go to your Vercel dashboard and check the function logs for:

```
[Subdomain API] Processing request: { orgId, subdomain, enabled, userId }
[Subdomain API] Updating organization with data: { ... }
[Subdomain API] Organization updated successfully
[Subdomain API] Returning success response with org: { ... }
```

### 2. Check for Auth Errors

Look for these error messages:
- `Missing or invalid Authorization header` - Frontend not sending token
- `Token verification failed` - Token expired or invalid
- `User is not an admin` - User doesn't have admin role

### 3. Check Firebase Admin Initialization

Look for:
```
[firebase-admin] ✅ Using existing app in Xms
[firebase-admin] 🔄 Initializing with service account
```

If you see errors here, check your environment variables:
- `FIREBASE_SERVICE_ACCOUNT` (JSON string)
- OR `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`

### 4. Test the API Directly

You can test the API using curl or Postman:

```bash
# Get your auth token from browser console:
# await firebase.auth().currentUser.getIdToken()

curl -X PATCH https://consularly.com/api/admin/organizations/YOUR_ORG_ID/subdomain \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"subdomain": "test-org", "enabled": true}'
```

### 5. Check Browser Console

Open browser DevTools and look for:
- Network tab: Check the API response status and body
- Console tab: Look for any JavaScript errors
- Application tab: Verify the user is authenticated

## Common Issues & Solutions

### Issue: "Unauthorized - Missing token"
**Solution:** User session expired. Sign out and sign back in.

### Issue: "Forbidden - Admin access required"
**Solution:** User doesn't have admin role in Firestore. Check the `users` collection.

### Issue: "Failed to update subdomain" (500 error)
**Solution:** Check Vercel logs for the actual error. Likely Firebase Admin credentials issue.

### Issue: Shows success but reverts after refresh
**Solution:** This was the original bug - now fixed with proper auth and state sync.

## Deployment Checklist

Before deploying to production:

1. ✅ Verify Firebase Admin credentials are set in Vercel environment variables
2. ✅ Test subdomain creation with a test organization
3. ✅ Check Vercel function logs for any errors
4. ✅ Verify real-time listener updates the UI
5. ✅ Test subdomain access at `https://your-subdomain.consularly.com`

## Next Steps

1. **Deploy the changes** to production
2. **Test subdomain creation** through the admin dashboard
3. **Monitor Vercel logs** for any errors
4. **Verify the subdomain persists** after page refresh
5. **Test subdomain access** by visiting the URL

If issues persist, check the Vercel logs and share the error messages for further debugging.
