# Subdomain Not Persisting - FINAL SOLUTION

## The Actual Problem

The API was returning **status 200** but the response body was **HTML instead of JSON**, causing:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause

The **middleware.ts** was processing API requests and interfering with the response!

### The Bug:
```typescript
// Skip middleware for static files and API routes (except subdomain APIs)
if (
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon.ico') ||
  pathname.startsWith('/api/subdomain')  // ❌ Only skips /api/subdomain
) {
  return NextResponse.next()
}
```

This meant `/api/admin/organizations/[id]/subdomain` was being processed by middleware, which was:
1. Checking for subdomain in the hostname
2. Potentially rewriting or redirecting the request
3. Returning HTML error pages instead of JSON

### The Fix:
```typescript
// Skip middleware for static files and ALL API routes
if (
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon.ico') ||
  pathname.startsWith('/api/')  // ✅ Skips ALL API routes
) {
  return NextResponse.next()
}
```

## What Was Fixed

### File 1: `middleware.ts`
**Changed:** Skip condition to exclude ALL `/api/` routes from middleware processing

### File 2: `src/app/api/admin/organizations/[id]/subdomain/route.ts`
**Changed:** 
- Updated params to `Promise<{ id: string }>` for Next.js 15
- Added `await params` to extract the ID
- Added authentication checks
- Added detailed logging

### File 3: `src/components/admin/SubdomainManager.tsx`
**Changed:**
- Added auth token to API requests
- Made validation non-blocking
- Added console logging
- Added state sync with props

## Why It Failed

1. **Middleware was intercepting API calls** → Returning HTML instead of JSON
2. **Next.js 15 params syntax** → Would have caused 404 (but middleware caught it first)
3. **Missing authentication** → Would have failed auth checks (but middleware caught it first)

## How to Test

1. **Deploy these changes**
2. **Go to** https://consularly.com/admin/organizations
3. **Open browser console** (F12)
4. **Edit an organization** → Subdomain tab
5. **Set a subdomain** and enable it
6. **Click Save**
7. **Check console** - Should now see:
   ```
   [SubdomainManager] Saving subdomain: { subdomain: "...", enabled: true, orgId: "..." }
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: { success: true, organization: {...} }
   ```
8. **Refresh page** - Subdomain should persist ✅

## Expected Behavior

✅ API returns JSON (not HTML)
✅ Response status: 200
✅ Success message appears
✅ Subdomain persists after refresh
✅ No more "Unexpected token" errors

## If It Still Fails

### Check Vercel Logs:
Look for these messages:
- `[Subdomain API] Processing request:`
- `[Subdomain API] Updating organization with data:`
- `[Subdomain API] Organization updated successfully`
- `[Subdomain API] Returning success response`

### Check Browser Console:
- Should see `[SubdomainManager]` logs
- Should NOT see "Unexpected token" errors
- Should see status 200, not 404 or 500

### Common Issues:

**Still getting HTML response**
→ Make sure middleware changes are deployed
→ Check that pathname starts with `/api/`

**401 Unauthorized**
→ Sign out and back in (token expired)

**403 Forbidden**
→ User doesn't have admin role in Firestore

**500 Internal Server Error**
→ Check Vercel logs for Firebase Admin errors

## Summary

The issue was a **middleware configuration bug** that was processing API routes when it shouldn't. The middleware was designed to handle subdomain routing for pages, but it was also catching API calls and returning HTML error pages instead of letting the API routes handle the requests properly.

By changing the skip condition from `/api/subdomain` to `/api/`, we ensure ALL API routes bypass the middleware and return proper JSON responses.
