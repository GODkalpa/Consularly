# What to Do Now - Quick Action Plan

## ✅ Current Status
- DNS is working
- Subdomain loads (testorg.consularly.com)
- Shows "Not secure" (waiting for SSL)

## 🚀 Immediate Actions (Do These Now)

### 1. Fix SSL Certificate (5 min)
**Vercel Dashboard → Domains:**
1. Remove `*.consularly.com`
2. Wait 30 seconds
3. Add `*.consularly.com` again
4. Wait 10 minutes for SSL

### 2. Deploy Firestore Index (2 min)
```bash
firebase deploy --only firestore:indexes
```

### 3. Check Environment Variables (2 min)
**Vercel → Settings → Environment Variables:**
```
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_BASE_DOMAIN=consularly.com
NEXT_PUBLIC_BASE_URL=https://consularly.com
NEXT_PUBLIC_DEV_MODE=false
```

If missing, add them and redeploy.

### 4. Wait for SSL (10 min)
- Get coffee ☕
- SSL certificate provisions automatically
- Check: `https://testorg.consularly.com` should show 🔒

---

## 📋 Next Steps (After SSL Works)

### 5. Assign Subdomain to Organization (5 min)

**Option A: Run Script**
```bash
npx tsx scripts/assign-test-subdomain.ts
```

**Option B: Firebase Console**
1. Firestore → organizations
2. Select an organization
3. Add fields:
   - `subdomain`: "testorg"
   - `subdomainEnabled`: true

### 6. Test It (2 min)
Visit: `https://testorg.consularly.com`

Should show:
- ✅ Secure connection
- ✅ Login page
- ✅ Organization branding (if configured)

---

## 🔧 Integration Tasks (1-2 hours)

### 7. Add SubdomainManager to Admin

**File:** Your organization edit page

```tsx
import SubdomainManager from '@/components/admin/SubdomainManager';

<SubdomainManager
  orgId={org.id}
  orgName={org.name}
  currentSubdomain={org.subdomain}
  currentEnabled={org.subdomainEnabled}
  onUpdate={refresh}
/>
```

### 8. Add Subdomain Column to Org List

**File:** Your organizations table

```tsx
<TableCell>
  {org.subdomain ? (
    <a href={`https://${org.subdomain}.consularly.com`} target="_blank">
      {org.subdomain}
    </a>
  ) : (
    'Not configured'
  )}
</TableCell>
```

### 9. Update Sign-In Page

**File:** `src/app/signin/page.tsx`

```tsx
import { useOrgContext } from '@/hooks/useOrgContext';
import { DynamicFavicon } from '@/components/branding/DynamicFavicon';
import { DynamicStyles } from '@/components/branding/DynamicStyles';

const { context } = useOrgContext();

// Apply branding
{context?.branding && (
  <>
    <DynamicFavicon faviconUrl={context.branding.favicon} />
    <DynamicStyles branding={context.branding} />
  </>
)}

// Show org logo
{context?.branding?.logoUrl && (
  <img src={context.branding.logoUrl} alt={context.orgName} />
)}

// Hide platform branding if white-label
{!context?.branding?.whiteLabel && (
  <footer>Powered by Consularly</footer>
)}
```

---

## ✅ Testing Checklist

- [ ] SSL certificate working (🔒 in browser)
- [ ] Main portal works (consularly.com)
- [ ] Subdomain loads (testorg.consularly.com)
- [ ] Organization branding displays
- [ ] Non-existent subdomain shows error
- [ ] Admin can access any subdomain
- [ ] Users can't access other org subdomains

---

## 📚 Documentation

- **Setup Guide:** `SUBDOMAIN_SETUP_GUIDE.md`
- **SSL Fix:** `FIX_SSL_CERTIFICATE.md`
- **Next Steps:** `SUBDOMAIN_NEXT_STEPS.md`
- **Deployment:** `SUBDOMAIN_DEPLOYMENT_CHECKLIST.md`

---

## 🆘 If Something Goes Wrong

### SSL Not Working After 30 Minutes
- Contact Vercel support
- Or change to Vercel nameservers

### Organization Not Found Error
- Check Firestore index is deployed
- Verify organization has `subdomain` field
- Check `subdomainEnabled` is true

### Branding Not Loading
- Check organization has `settings.customBranding`
- Test API: `/api/subdomain/context`
- Check browser console for errors

---

## ⏱️ Time Estimates

- **Fix SSL:** 15 minutes (mostly waiting)
- **Deploy index:** 5 minutes
- **Assign subdomain:** 5 minutes
- **Test:** 10 minutes
- **Integration:** 1-2 hours
- **Full testing:** 30 minutes

**Total:** 2-3 hours to fully complete

---

## 🎯 Success Criteria

When you're done, you should be able to:

1. ✅ Visit any subdomain with SSL (🔒)
2. ✅ Assign subdomains via admin dashboard
3. ✅ See organization branding on subdomain
4. ✅ Users can only access their org's subdomain
5. ✅ Admins can access any subdomain
6. ✅ Error pages work correctly

---

**Current Priority:** Fix SSL certificate in Vercel (Step 1)
**Next Priority:** Deploy Firestore index (Step 2)
**Then:** Test and integrate into admin dashboard

