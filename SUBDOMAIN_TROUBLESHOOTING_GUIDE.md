# Subdomain Troubleshooting Guide

## Issue: "Organization Not Found" Error

You're seeing this error when visiting `https://sumedha-education.consularly.com`:

```
Organization Not Found
This subdomain is not configured.
```

### ✅ What's Working

1. **Subdomain is correctly configured in Firestore**
   - Organization: Sumedha Education
   - Subdomain: sumedha-education
   - Enabled: true
   - Verified with: `npx tsx scripts/check-subdomain.ts sumedha-education`

2. **Subdomain extraction logic is correct**
   - Tested with: `npx tsx scripts/test-subdomain-extraction.ts`
   - Correctly extracts "sumedha-education" from hostname

3. **Environment variables are set**
   - `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true`
   - `NEXT_PUBLIC_BASE_DOMAIN=consularly.com`

### ❌ What's Not Working

The middleware is not finding the organization in production. This could be due to:

1. **Vercel deployment issue** - Old code deployed
2. **Wildcard domain not configured** - `*.consularly.com` not added to Vercel
3. **Firestore query failing** - Permissions or connection issue
4. **Cache issue** - Vercel edge cache serving stale response

## Solution Steps

### Step 1: Check Vercel Domain Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Domains**
4. Check if `*.consularly.com` is listed
5. Status should be **"Valid Configuration"**

**If not listed:**
```
1. Click "Add Domain"
2. Enter: *.consularly.com
3. Vercel will verify automatically
4. Wait 2-3 minutes for propagation
```

**If status is "Invalid Configuration":**
```
1. Click "Refresh" button
2. Wait 2-3 minutes
3. If still invalid, remove and re-add the domain
```

### Step 2: Redeploy with Latest Code

The middleware has been updated with better logging. Deploy the changes:

```bash
# Option 1: Using Vercel CLI
vercel --prod

# Option 2: Using Git (if connected)
git add .
git commit -m "Fix subdomain middleware logging"
git push origin main
```

### Step 3: Check Deployment Logs

After deployment, check the logs:

```bash
# View real-time logs
vercel logs --follow

# Or visit the deployment in Vercel Dashboard
# Click on the deployment → View Function Logs
```

Look for these log messages:
```
[Middleware] Hostname: sumedha-education.consularly.com
[Middleware] Processing subdomain: sumedha-education
[Subdomain Middleware] Querying Firestore for subdomain: sumedha-education
[Subdomain Middleware] Found organization: Sumedha Education
```

### Step 4: Test the Diagnostic API

Visit this URL to check the status:
```
https://consularly.com/api/debug/subdomain-status
```

Or test from the subdomain:
```
https://sumedha-education.consularly.com/api/debug/subdomain-status
```

This will show:
- Current hostname
- Detected subdomain
- Environment variables
- Organization lookup result
- Any errors

### Step 5: Clear Vercel Cache

If the issue persists, clear Vercel's edge cache:

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click **"Redeploy"** button
4. Select **"Use existing Build Cache"** → **NO**
5. Click **"Redeploy"**

### Step 6: Test Locally First

Before testing in production, verify it works locally:

```bash
# Start dev server
npm run dev

# In another terminal, test with curl
curl -H "Host: sumedha-education.localhost" http://localhost:3000/

# Or add to your hosts file (Windows: C:\Windows\System32\drivers\etc\hosts)
127.0.0.1 sumedha-education.localhost

# Then visit in browser
http://sumedha-education.localhost:3000/
```

## Common Issues and Fixes

### Issue 1: Wildcard Domain Not Working

**Symptoms:**
- 404 error
- "This site can't be reached"
- DNS_PROBE_FINISHED_NXDOMAIN

**Fix:**
1. Verify DNS records in Cloudflare/DNS provider
2. Add wildcard A record: `*.consularly.com` → Vercel IP
3. Wait 5-10 minutes for DNS propagation
4. Test with: `nslookup sumedha-education.consularly.com`

### Issue 2: Firestore Query Failing

**Symptoms:**
- Logs show "No organization found"
- But organization exists in Firestore

**Fix:**
1. Check Firestore indexes are deployed:
   ```bash
   firebase deploy --only firestore:indexes
   ```
2. Verify index status in Firebase Console
3. Check Firebase Admin SDK credentials in Vercel environment variables

### Issue 3: Middleware Not Running

**Symptoms:**
- No middleware logs in Vercel
- Page loads but without subdomain context

**Fix:**
1. Check `middleware.ts` is in project root
2. Verify `config.matcher` includes your routes
3. Redeploy with: `vercel --prod --force`

### Issue 4: Environment Variables Not Set

**Symptoms:**
- `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING` is undefined
- Subdomain routing disabled

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add all required variables:
   ```
   NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
   NEXT_PUBLIC_BASE_DOMAIN=consularly.com
   NEXT_PUBLIC_BASE_URL=https://consularly.com
   ```
3. **Important:** Redeploy after adding variables!

## Quick Diagnostic Commands

```bash
# Check if subdomain is in Firestore
npx tsx scripts/check-subdomain.ts sumedha-education

# Test subdomain extraction
npx tsx scripts/test-subdomain-extraction.ts

# Check DNS
nslookup sumedha-education.consularly.com

# Test API endpoint
curl https://consularly.com/api/debug/subdomain?subdomain=sumedha-education

# View Vercel logs
vercel logs --follow
```

## Expected Behavior

When everything is working:

1. **Visit subdomain:** `https://sumedha-education.consularly.com`
2. **Middleware runs:**
   - Extracts subdomain: "sumedha-education"
   - Queries Firestore
   - Finds organization
   - Sets headers: `x-org-id`, `x-subdomain`, `x-org-name`
3. **Page loads:**
   - Shows organization branding (if configured)
   - Shows organization-specific content
   - Users can sign in to this organization

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check the middleware logs** - Look for error messages
2. **Test the debug API** - Visit `/api/debug/subdomain-status`
3. **Verify Firestore data** - Run `npx tsx scripts/check-subdomain.ts`
4. **Check Vercel deployment** - Ensure latest code is deployed
5. **Contact support** - Share the diagnostic API output

## Next Steps After Fix

Once the subdomain is working:

1. Test with different organizations
2. Test access control (users from different orgs)
3. Configure organization branding
4. Test sign-in flow
5. Roll out to more organizations

---

**Quick Fix Checklist:**
- [ ] Wildcard domain added to Vercel
- [ ] Latest code deployed
- [ ] Environment variables set
- [ ] Firestore indexes deployed
- [ ] Cache cleared
- [ ] Tested diagnostic API
- [ ] Verified in logs
