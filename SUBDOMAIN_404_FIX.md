# Subdomain 404 Error - FIXED

## The Real Problem

The API was returning **404 Not Found** because of incorrect Next.js 15 App Router syntax.

### Error in Browser Console:
```
Failed to load resource: the server responded with a status of 404 ()
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This meant the API route wasn't being recognized, and Next.js was returning an HTML 404 page instead of JSON.

## Root Cause

In **Next.js 15**, dynamic route params are now **Promises** and must be awaited.

### Old (Broken) Syntax:
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }  // ❌ Wrong in Next.js 15
) {
  const orgId = params.id;  // ❌ This doesn't work anymore
  // ...
}
```

### New (Fixed) Syntax:
```typescript
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ Correct
) {
  const { id: orgId } = await params;  // ✅ Must await
  // ...
}
```

## What Was Fixed

**File:** `src/app/api/admin/organizations/[id]/subdomain/route.ts`

**Changes:**
1. Changed `params: { id: string }` to `params: Promise<{ id: string }>`
2. Added `await params` to extract the `id`
3. Applied to both PATCH and GET endpoints

## How to Test

1. **Deploy the changes**
2. **Go to** https://consularly.com/admin/organizations
3. **Open browser console** (F12)
4. **Edit an organization** → Subdomain tab
5. **Set a subdomain** and enable it
6. **Click Save**
7. **Check console** - Should see:
   ```
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: { success: true, ... }
   ```
8. **Refresh page** - Subdomain should persist

## Expected Behavior

✅ No more 404 errors
✅ API returns JSON instead of HTML
✅ Subdomain saves successfully
✅ Subdomain persists after refresh
✅ Console shows proper success messages

## If It Still Fails

### Check for these errors:

**401 Unauthorized**
→ Token expired, sign out and back in

**403 Forbidden**
→ User doesn't have admin role in Firestore

**500 Internal Server Error**
→ Check Vercel logs for Firebase Admin errors

## Other Routes That Need Fixing

Many other API routes still use the old syntax and will have the same 404 issue. These should be updated:

- `/api/admin/organizations/[id]/email-alias/route.ts`
- `/api/admin/accounting/*/[id]/route.ts`
- `/api/org/students/[id]/route.ts` (already fixed)
- `/api/interviews/[id]/route.ts`
- And many more...

But for now, the subdomain route is fixed and should work!

## Reference

- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Dynamic Routes in App Router](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
