# Subdomain Production Issue - Fixed

## What Was Wrong

The subdomain API endpoint was **missing authentication checks**, which caused it to fail silently in production. The issues were:

1. **No Authorization header** - The API wasn't verifying the user's identity
2. **No admin role check** - Anyone could potentially call the endpoint
3. **Poor error logging** - Errors were caught but not detailed enough
4. **React state not syncing** - Component state wasn't updating when props changed

## What Was Fixed

### 1. Added Authentication to API Routes

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
