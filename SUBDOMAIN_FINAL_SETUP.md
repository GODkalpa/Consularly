# Subdomain Feature - Final Setup Steps

## ✅ DNS is Working!

Your DNS test shows:
```
testorg.consularly.com → 76.76.21.123 (Vercel IP)
```

DNS is configured correctly and propagated! 🎉

## Remaining Steps to Go Live

### 1. Fix Vercel Domain Configuration

**Option A: Refresh Domain**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Find `*.consularly.com`
3. Click **"Refresh"** button
4. Wait 2-3 minutes
5. Status should change to "Valid Configuration"

**Option B: Remove and Re-add (if refresh doesn't work)**
1. Click "Remove" on `*.consularly.com`
2. Click "Add Domain"
3. Enter: `*.consularly.com`
4. Vercel will auto-verify

### 2. Deploy Firestore Index

```bash
firebase deploy --only firestore:indexes
```

Wait for index to build (check Firebase Console → Firestore → Indexes).

### 3. Set Environment Variables in Vercel

Go to Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_BASE_DOMAIN=consularly.com
NEXT_PUBLIC_BASE_URL=https://consularly.com
NEXT_PUBLIC_DEV_MODE=false
```

**Important:** Redeploy after adding variables!

### 4. Deploy Your Application

```bash
# Option 1: Vercel CLI
vercel --prod

# Option 2: Git push (if using Git integration)
git add .
git commit -m "Add subdomain white-labeling"
git push origin main
```

### 5. Assign Subdomain to Test Organization

Run the script:

```bash
npx tsx scripts/assign-test-subdomain.ts
```

Or manually in Firebase Console:
1. Go to Firestore → organizations collection
2. Select an organization
3. Add fields:
   ```
   subdomain: "testorg"
   subdomainEnabled: true
   subdomainCreatedAt: [current timestamp]
   ```

### 6. Test the Feature

Visit your subdomain:
```
https://testorg.consularly.com
```

You should see:
- ✅ Page loads (not 404)
- ✅ Organization branding applied (if configured)
- ✅ Login page shows organization name
- ✅ No errors in browser console

### 7. Test Access Control

**Test 1: Organization Not Found**
```
Visit: https://nonexistent.consularly.com
Expected: "Organization Not Found" error page
```

**Test 2: Main Portal Still Works**
```
Visit: https://consularly.com
Expected: Main portal loads normally
```

**Test 3: Admin Access**
```
1. Log in as platform admin
2. Visit: https://testorg.consularly.com
Expected: Full access granted
```

**Test 4: Cross-Org Access Blocked**
```
1. Log in as user from Org A
2. Visit Org B's subdomain
Expected: "Access Denied" error page
```

## Troubleshooting

### Issue: Vercel Still Shows "Invalid Configuration"

**Solution:**
1. Check DNS again: `nslookup testorg.consularly.com`
2. Should return Vercel IPs (76.76.21.123 or similar)
3. If yes, remove and re-add domain in Vercel
4. Contact Vercel support if still failing

### Issue: 404 Error on Subdomain

**Possible causes:**
1. Application not deployed
2. Environment variables not set
3. Middleware not running

**Solution:**
```bash
# Redeploy
vercel --prod

# Check deployment logs
vercel logs
```

### Issue: "Organization Not Found" Error

**Possible causes:**
1. Firestore index not deployed
2. Organization doesn't have subdomain assigned
3. subdomainEnabled is false

**Solution:**
1. Check Firestore index status
2. Verify organization has `subdomain` field
3. Verify `subdomainEnabled: true`

### Issue: Branding Not Loading

**Possible causes:**
1. Organization doesn't have branding configured
2. API endpoint not working

**Solution:**
1. Check organization has `settings.customBranding` object
2. Test API: `https://consularly.com/api/subdomain/context`
3. Check browser console for errors

## Quick Test Commands

```bash
# Test DNS
nslookup testorg.consularly.com

# Test API (after deployment)
curl https://consularly.com/api/subdomain/lookup?subdomain=testorg

# Check Firestore index
firebase firestore:indexes:list

# View deployment logs
vercel logs
```

## Success Criteria

- [ ] Vercel shows "Valid Configuration" for `*.consularly.com`
- [ ] Firestore index is "Enabled"
- [ ] Environment variables set in Vercel
- [ ] Application deployed to production
- [ ] Test organization has subdomain assigned
- [ ] Subdomain URL loads without errors
- [ ] Branding applies correctly
- [ ] Access control works
- [ ] Error pages display correctly

## Next Steps After Testing

Once everything works:

1. **Integrate SubdomainManager into Admin Dashboard**
   - Add to organization edit page
   - Allow admins to assign subdomains via UI

2. **Update Sign-In Page with Branding**
   - Apply organization logo
   - Apply organization colors
   - Hide platform branding if white-label enabled

3. **Apply Branding to Dashboards**
   - Organization dashboard
   - Student portal
   - Interview pages

4. **Roll Out to Organizations**
   - Start with pilot organizations
   - Gather feedback
   - Gradually enable for all

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Vercel deployment logs
3. Check middleware logs
4. Review documentation in `SUBDOMAIN_SETUP_GUIDE.md`
5. Test locally with `http://testorg.localhost:3000`

---

**Current Status:** DNS is working! ✅
**Next Action:** Fix Vercel domain configuration
**Estimated Time:** 5-10 minutes

