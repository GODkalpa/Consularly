# Subdomain Quick Fix Guide

## Problem
Visiting `https://sumedha-education.consularly.com` shows:
```
Organization Not Found
This subdomain is not configured.
```

## Root Cause
The middleware is not finding the organization in Firestore, even though it exists.

## ✅ Verified Working
- ✅ Subdomain exists in Firestore (`sumedha-education`)
- ✅ Subdomain is enabled (`subdomainEnabled: true`)
- ✅ Subdomain extraction logic works correctly
- ✅ Environment variables are set

## 🔧 Fix Steps

### Step 1: Deploy Latest Code (REQUIRED)

The middleware has been updated with better logging. You MUST deploy:

```bash
# Commit changes
git add .
git commit -m "Fix subdomain middleware with enhanced logging"

# Deploy to Vercel
git push origin main

# OR use Vercel CLI
vercel --prod
```

**Why:** The production deployment is running old code without the fixes.

### Step 2: Verify Wildcard Domain in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (consularly)
3. Go to **Settings** → **Domains**
4. Look for `*.consularly.com`

**If NOT found:**
```
1. Click "Add Domain"
2. Enter: *.consularly.com
3. Click "Add"
4. Wait 2-3 minutes
```

**If found but shows "Invalid Configuration":**
```
1. Click the "Refresh" button next to the domain
2. Wait 2-3 minutes
3. If still invalid, remove and re-add
```

### Step 3: Check Environment Variables in Vercel

1. Go to **Settings** → **Environment Variables**
2. Verify these exist for **Production**:
   ```
   NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING = true
   NEXT_PUBLIC_BASE_DOMAIN = consularly.com
   NEXT_PUBLIC_BASE_URL = https://consularly.com
   ```

3. Also verify Firebase credentials are set:
   ```
   FIREBASE_PROJECT_ID
   FIREBASE_CLIENT_EMAIL
   FIREBASE_PRIVATE_KEY
   ```

**If any are missing:** Add them and redeploy!

### Step 4: Test After Deployment

Wait 2-3 minutes after deployment, then test:

**Test 1: Diagnostic API**
```
Visit: https://consularly.com/api/debug/subdomain-status
```

Should show:
```json
{
  "hostname": "consularly.com",
  "subdomain": null,
  "environment": {
    "NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING": "true",
    ...
  }
}
```

**Test 2: Subdomain Diagnostic**
```
Visit: https://sumedha-education.consularly.com/api/debug/subdomain-status
```

Should show:
```json
{
  "hostname": "sumedha-education.consularly.com",
  "subdomain": "sumedha-education",
  "organization": {
    "found": true,
    "name": "Sumedha Education",
    ...
  }
}
```

**Test 3: Subdomain Homepage**
```
Visit: https://sumedha-education.consularly.com/
```

Should show the landing page (not "Organization Not Found").

### Step 5: Check Deployment Logs

If still not working, check the logs:

```bash
# Using Vercel CLI
vercel logs --follow

# Or in Vercel Dashboard
# Go to your project → Deployments → Click latest → View Function Logs
```

Look for these messages:
```
[Middleware] Hostname: sumedha-education.consularly.com
[Middleware] Processing subdomain: sumedha-education
[Subdomain Middleware] Querying Firestore for subdomain: sumedha-education
[Subdomain Middleware] Found organization: Sumedha Education (jLZEhqyndK6qDt8MEiXH)
```

If you see:
```
[Subdomain Middleware] No organization found for subdomain: sumedha-education
```

Then there's a Firestore query issue. Check:
1. Firestore indexes are deployed
2. Firebase credentials are correct in Vercel
3. Organization still exists in Firestore

## 🚨 Most Common Issues

### Issue 1: Old Code Deployed
**Symptom:** No new logs, same error
**Fix:** Redeploy with `vercel --prod --force`

### Issue 2: Wildcard Domain Not Added
**Symptom:** DNS works but Vercel shows 404
**Fix:** Add `*.consularly.com` to Vercel domains

### Issue 3: Environment Variables Not Set
**Symptom:** Subdomain routing disabled
**Fix:** Add env vars in Vercel and redeploy

### Issue 4: Firestore Index Not Deployed
**Symptom:** Logs show "No organization found"
**Fix:** Run `firebase deploy --only firestore:indexes`

## 📋 Quick Checklist

Before testing:
- [ ] Latest code committed and pushed
- [ ] Deployed to Vercel (wait 2-3 minutes)
- [ ] Wildcard domain `*.consularly.com` added to Vercel
- [ ] Domain shows "Valid Configuration"
- [ ] Environment variables set in Vercel
- [ ] Firestore indexes deployed
- [ ] Waited 2-3 minutes after deployment

## 🎯 Expected Result

After following all steps:

1. Visit `https://sumedha-education.consularly.com`
2. See the subdomain landing page (or sign-in page)
3. No "Organization Not Found" error
4. Organization branding applied (if configured)

## 🆘 Still Not Working?

If you've done all the above and it's still not working:

1. **Run diagnostic API:**
   ```
   https://sumedha-education.consularly.com/api/debug/subdomain-status
   ```
   
2. **Check Vercel logs:**
   ```bash
   vercel logs --follow
   ```

3. **Verify Firestore:**
   ```bash
   npx tsx scripts/check-subdomain.ts sumedha-education
   ```

4. **Test DNS:**
   ```bash
   nslookup sumedha-education.consularly.com
   ```

5. **Share the output** of all the above for further debugging.

## 💡 Pro Tip

Test locally first before deploying:

```bash
# Start dev server
npm run dev

# Add to hosts file (Windows: C:\Windows\System32\drivers\etc\hosts)
127.0.0.1 sumedha-education.localhost

# Visit in browser
http://sumedha-education.localhost:3000/
```

This way you can verify the middleware works before deploying to production.

---

**TL;DR:**
1. Deploy latest code: `git push origin main`
2. Add wildcard domain to Vercel: `*.consularly.com`
3. Wait 2-3 minutes
4. Test: `https://sumedha-education.consularly.com/api/debug/subdomain-status`
