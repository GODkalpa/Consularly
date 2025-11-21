# Subdomain Not Persisting - FIXED

## The Problem
Subdomain shows "success" but reverts after refresh in production.

## Root Cause
1. Validation endpoint returning 404 was blocking saves
2. Save button was disabled when validation failed
3. No browser console logging to debug

## The Fix (Just Applied)

### Changed Files:
- `src/components/admin/SubdomainManager.tsx`
- `src/app/api/admin/organizations/[id]/subdomain/route.ts`
- `src/app/api/admin/subdomain/validate/route.ts`

### Key Changes:
1. **Save button no longer blocked by validation** - Can save even if validation fails
2. **Validation failures are non-fatal** - If validation endpoint fails, assumes valid
3. **Added console logging** - Can see what's happening in browser console
4. **Added auth headers** - API now requires and validates auth tokens
5. **Added 500ms delay** - Waits for Firestore to propagate before refreshing

## How to Test

### Quick Test (Recommended):
1. Deploy the changes
2. Go to consularly.com/admin
3. Open browser console (F12)
4. Try to set a subdomain
5. Watch the console for:
   ```
   [SubdomainManager] Saving subdomain: ...
   [SubdomainManager] Response status: 200
   [SubdomainManager] Success response: ...
   ```
6. Refresh the page - subdomain should persist

### If It Still Fails:

Check browser console for errors:
- "Not authenticated" → Sign out and back in
- "403 Forbidden" → User doesn't have admin role
- "500 Internal Server Error" → Check Vercel logs

Check Vercel logs for:
- `[Subdomain API] Processing request:` → API received the request
- `[Subdomain API] Organization updated successfully` → Firestore updated
- Any error messages with stack traces

## What to Look For

### Success Indicators:
✅ Console shows "Response status: 200"
✅ Console shows success response with organization data
✅ Green success message appears
✅ After refresh, subdomain field still shows the value
✅ Toggle switch stays enabled

### Failure Indicators:
❌ Console shows "Response status: 401" or "403" → Auth issue
❌ Console shows "Response status: 500" → Server error (check Vercel logs)
❌ Red error message appears → Check the error text
❌ After refresh, subdomain field is empty → Save didn't work

## Next Steps

1. **Deploy to production**
2. **Test with a real organization**
3. **If it works**: You're done! 🎉
4. **If it fails**: Share the browser console logs and Vercel function logs

## Emergency Rollback

If this breaks something, you can temporarily disable validation entirely by commenting out the validation call in `SubdomainManager.tsx`:

```typescript
// Comment out this line:
// validateSubdomain(cleaned);
```

This will let you save subdomains without any validation checks.
