# Subdomain - Temporary Fix to Test

## What's Happening

The production site is returning HTML instead of JSON because:
1. The code changes haven't been deployed yet, OR
2. There's a build/deployment issue with the dynamic route

## Temporary Solution

I've created a **simplified test endpoint** that:
- ✅ Removes authentication requirements
- ✅ Uses simpler code
- ✅ Has extensive logging
- ✅ Tests if the basic Firestore update works

### New Files Created:

1. **`src/app/api/admin/organizations/[id]/subdomain-temp/route.ts`**
   - Simplified version without auth
   - Same functionality, just easier to debug

2. **Updated `src/components/admin/SubdomainManager.tsx`**
   - Now uses the temp endpoint by default
   - Can switch back to main endpoint with a flag

## How to Test

### Step 1: Deploy
```bash
git add .
git commit -m "Add temporary subdomain endpoint for testing"
git push
```

### Step 2: Wait for Vercel Deployment
- Go to Vercel dashboard
- Wait for deployment to complete
- Check build logs for any errors

### Step 3: Test in Production
1. Go to https://consularly.com/admin/organizations
2. Open browser console (F12)
3. Edit an organization → Subdomain tab
4. Set a subdomain and enable it
5. Click "Save Configuration"
6. Watch the console for:
   ```
   [SubdomainManager] Using endpoint: /api/admin/organizations/.../subdomain-temp
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: { success: true, ... }
   ```

### Step 4: Check Vercel Logs
Go to Vercel → Functions → Logs and look for:
```
[Subdomain TEMP API] Request: { orgId, subdomain, enabled }
[Subdomain TEMP API] Updating with: { ... }
[Subdomain TEMP API] Success: { subdomain, enabled }
```

## Expected Results

### If It Works:
✅ Console shows status 200
✅ Console shows success response with organization data
✅ Subdomain persists after page refresh
✅ **This means the Firestore update works, and the issue was authentication**

### If It Still Fails:

**404 Error**
→ The route file didn't deploy correctly
→ Check Vercel build logs
→ Make sure the file is in the correct location

**500 Error**
→ Firebase Admin issue
→ Check Vercel logs for the actual error
→ Verify environment variables are set

**Still getting HTML**
→ Middleware is still interfering
→ Check that middleware.ts changes were deployed
→ Verify the endpoint path starts with `/api/`

## Once It Works

After confirming the temp endpoint works, we can:

1. **Switch back to the main endpoint** by changing this line in `SubdomainManager.tsx`:
   ```typescript
   const useTempEndpoint = false; // Changed from true
   ```

2. **Add authentication back** to the main endpoint

3. **Delete the temp endpoint** file

## Why This Approach?

This isolates the problem:
- If temp endpoint works → Auth was the issue
- If temp endpoint fails → Firestore/Firebase Admin issue
- If both fail → Deployment/build issue

## Current Status

The temp endpoint is now:
- ✅ Created
- ✅ Configured in SubdomainManager
- ⏳ Waiting for deployment
- ⏳ Waiting for testing

Deploy and test to see if this resolves the issue!
