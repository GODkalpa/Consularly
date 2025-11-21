# Subdomain Issue - Fix Summary

## Problem
You set up subdomain `sumedha-education` for "Sumedha Education" organization in the admin dashboard, but visiting `https://sumedha-education.consularly.com` shows:

```
Organization Not Found
This subdomain is not configured.
```

## Root Cause Analysis

### ✅ What's Working
1. **Firestore Configuration** - Organization exists with correct subdomain
   - Verified with: `npx tsx scripts/check-subdomain.ts sumedha-education`
   - Result: ✅ Found, enabled, correct subdomain

2. **Subdomain Extraction** - Logic correctly extracts subdomain from hostname
   - Verified with: `npx tsx scripts/test-subdomain-extraction.ts`
   - Result: ✅ Correctly extracts "sumedha-education"

3. **Environment Variables** - All required variables are set in `.env.local`
   - `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true`
   - `NEXT_PUBLIC_BASE_DOMAIN=consularly.com`

### ❌ What's Not Working
The middleware is not finding the organization in production. Possible causes:

1. **Old code deployed** - Production is running code without the latest fixes
2. **Wildcard domain not configured** - `*.consularly.com` not added to Vercel
3. **Firestore query failing** - Permissions or connection issue in production
4. **Cache issue** - Vercel edge cache serving stale response

## Changes Made

### 1. Enhanced Middleware Logging
Updated `src/lib/subdomain-middleware.ts` with detailed logging:
- Logs Firestore query execution
- Logs query results
- Lists all organizations with subdomains when lookup fails
- Better error handling and stack traces

### 2. Created Diagnostic APIs
- `src/app/api/debug/subdomain/route.ts` - Test subdomain lookup
- `src/app/api/debug/subdomain-status/route.ts` - Full diagnostic info

### 3. Created Helper Scripts
- `scripts/check-subdomain.ts` - Verify subdomain in Firestore
- `scripts/test-subdomain-extraction.ts` - Test subdomain extraction logic
- `scripts/test-subdomain-live.ts` - Test production deployment

### 4. Created Documentation
- `SUBDOMAIN_QUICK_FIX.md` - Step-by-step fix guide
- `SUBDOMAIN_TROUBLESHOOTING_GUIDE.md` - Comprehensive troubleshooting
- `SUBDOMAIN_FIX_SUMMARY.md` - This file

## Required Actions

### 🚨 CRITICAL: Deploy Latest Code

The middleware changes MUST be deployed to production:

```bash
# Option 1: Git push (if connected to Vercel)
git add .
git commit -m "Fix subdomain middleware with enhanced logging"
git push origin main

# Option 2: Vercel CLI
vercel --prod

# Option 3: Force redeploy
vercel --prod --force
```

### ✅ Verify Vercel Configuration

1. **Add Wildcard Domain**
   - Go to Vercel Dashboard → Settings → Domains
   - Add: `*.consularly.com`
   - Verify status is "Valid Configuration"

2. **Check Environment Variables**
   - Go to Settings → Environment Variables
   - Verify all Firebase and subdomain variables are set for **Production**
   - If any are missing, add them and redeploy

3. **Deploy Firestore Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Testing Steps

### After Deployment (wait 2-3 minutes):

**Test 1: Diagnostic API**
```
Visit: https://consularly.com/api/debug/subdomain?subdomain=sumedha-education
```
Expected: JSON showing organization found

**Test 2: Subdomain Diagnostic**
```
Visit: https://sumedha-education.consularly.com/api/debug/subdomain-status
```
Expected: JSON showing subdomain detected and organization found

**Test 3: Subdomain Homepage**
```
Visit: https://sumedha-education.consularly.com/
```
Expected: Landing page or sign-in page (NOT "Organization Not Found")

**Test 4: Check Logs**
```bash
vercel logs --follow
```
Look for:
```
[Middleware] Processing subdomain: sumedha-education
[Subdomain Middleware] Found organization: Sumedha Education
```

## Quick Diagnostic Commands

```bash
# Check Firestore
npx tsx scripts/check-subdomain.ts sumedha-education

# Test subdomain extraction
npx tsx scripts/test-subdomain-extraction.ts

# Test production (after deployment)
npx tsx scripts/test-subdomain-live.ts sumedha-education

# Check DNS
nslookup sumedha-education.consularly.com

# View Vercel logs
vercel logs --follow
```

## Expected Behavior After Fix

1. **Middleware detects subdomain:**
   ```
   [Middleware] Hostname: sumedha-education.consularly.com
   [Middleware] Subdomain: sumedha-education
   ```

2. **Firestore query succeeds:**
   ```
   [Subdomain Middleware] Querying Firestore for subdomain: sumedha-education
   [Subdomain Middleware] Found organization: Sumedha Education (jLZEhqyndK6qDt8MEiXH)
   ```

3. **Headers are set:**
   ```
   x-org-id: jLZEhqyndK6qDt8MEiXH
   x-subdomain: sumedha-education
   x-org-name: Sumedha Education
   ```

4. **Page loads correctly:**
   - Shows organization landing page
   - Applies organization branding (if configured)
   - No error messages

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Old code deployed | Same error, no new logs | Redeploy with `vercel --prod --force` |
| Wildcard domain missing | 404 or DNS error | Add `*.consularly.com` to Vercel |
| Env vars not set | Subdomain routing disabled | Add env vars and redeploy |
| Firestore index missing | "No organization found" in logs | Deploy indexes with Firebase CLI |
| Cache issue | Stale content | Clear Vercel cache and redeploy |

## Files Modified

- `src/lib/subdomain-middleware.ts` - Enhanced logging
- `middleware.ts` - (no changes, but will use updated subdomain-middleware)

## Files Created

- `src/app/api/debug/subdomain/route.ts` - Diagnostic API
- `src/app/api/debug/subdomain-status/route.ts` - Status API
- `scripts/check-subdomain.ts` - Firestore check script
- `scripts/test-subdomain-extraction.ts` - Extraction test
- `scripts/test-subdomain-live.ts` - Production test
- `SUBDOMAIN_QUICK_FIX.md` - Quick fix guide
- `SUBDOMAIN_TROUBLESHOOTING_GUIDE.md` - Detailed troubleshooting
- `SUBDOMAIN_FIX_SUMMARY.md` - This file

## Next Steps

1. **Deploy the changes** (REQUIRED)
2. **Verify Vercel configuration** (wildcard domain, env vars)
3. **Test using diagnostic APIs**
4. **Check deployment logs**
5. **Test subdomain homepage**

## Success Criteria

- [ ] Code deployed to Vercel
- [ ] Wildcard domain configured
- [ ] Environment variables set
- [ ] Diagnostic API shows organization found
- [ ] Subdomain homepage loads without errors
- [ ] Middleware logs show successful lookup
- [ ] Organization branding applies (if configured)

---

**Status:** Ready to deploy
**Priority:** High
**Estimated Fix Time:** 5-10 minutes (after deployment)

**Next Action:** Deploy to Vercel with `git push origin main` or `vercel --prod`
