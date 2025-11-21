# Subdomain White-Labeling Deployment Checklist

## Pre-Deployment Setup

### 1. Firestore Index Deployment ⚠️ CRITICAL
- [ ] Run `firebase deploy --only firestore:indexes`
- [ ] Wait for index build to complete (check Firebase Console)
- [ ] Verify index status shows "Enabled"
- [ ] Test query: organizations where subdomain == 'test' and subdomainEnabled == true

### 2. Environment Variables
- [ ] Add to `.env.local` (development):
  ```env
  NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
  NEXT_PUBLIC_BASE_DOMAIN=consularly.com
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  NEXT_PUBLIC_DEV_MODE=true
  ```
- [ ] Add to Vercel (production):
  ```env
  NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
  NEXT_PUBLIC_BASE_DOMAIN=consularly.com
  NEXT_PUBLIC_BASE_URL=https://consularly.com
  NEXT_PUBLIC_DEV_MODE=false
  ```

### 3. Local Development Setup
- [ ] Add to hosts file:
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
  - Mac/Linux: `/etc/hosts`
  ```
  127.0.0.1 testorg.localhost
  127.0.0.1 demo.localhost
  ```
- [ ] Restart development server
- [ ] Test: Visit `http://testorg.localhost:3000`

---

## Integration Tasks

### 4. Admin Dashboard Integration
- [ ] Import SubdomainManager component
- [ ] Add to organization edit/details page
- [ ] Test subdomain assignment
- [ ] Test validation (format, uniqueness, reserved)
- [ ] Test enable/disable toggle

**Example Code:**
```tsx
import SubdomainManager from '@/components/admin/SubdomainManager';

<SubdomainManager
  orgId={organization.id}
  orgName={organization.name}
  currentSubdomain={organization.subdomain}
  currentEnabled={organization.subdomainEnabled}
  onUpdate={() => refreshOrganization()}
/>
```

### 5. Organizations List Enhancement
- [ ] Add subdomain column to table
- [ ] Show subdomain status badge
- [ ] Add link to visit subdomain
- [ ] Add filter for organizations with/without subdomains

**Example Code:**
```tsx
<TableCell>
  {org.subdomain ? (
    <a href={buildSubdomainUrl(org.subdomain)} target="_blank">
      {org.subdomain}
    </a>
  ) : (
    <span className="text-gray-400">Not configured</span>
  )}
</TableCell>
```

### 6. Sign-In Page Branding
- [ ] Import `useOrgContext` hook
- [ ] Import branding components
- [ ] Apply organization logo
- [ ] Apply organization colors
- [ ] Hide platform branding if white-label enabled
- [ ] Test on subdomain

**Example Code:**
```tsx
import { useOrgContext } from '@/hooks/useOrgContext';
import { DynamicFavicon } from '@/components/branding/DynamicFavicon';
import { DynamicStyles } from '@/components/branding/DynamicStyles';

const { context, loading } = useOrgContext();

{context?.branding && (
  <>
    <DynamicFavicon faviconUrl={context.branding.favicon} />
    <DynamicStyles branding={context.branding} />
  </>
)}
```

### 7. Dashboard Branding
- [ ] Apply branding to org dashboard
- [ ] Apply branding to student portal
- [ ] Apply branding to interview pages
- [ ] Test branding consistency across navigation

### 8. Session Management Update
- [ ] Update cookie domain based on subdomain
- [ ] Implement subdomain-scoped sessions
- [ ] Test cross-subdomain isolation
- [ ] Verify logout clears subdomain session

---

## DNS & Hosting Configuration

### 9. DNS Wildcard Setup (Hostinger)
- [ ] Log in to Hostinger control panel
- [ ] Navigate to DNS Zone Editor
- [ ] Add wildcard CNAME record:
  ```
  Type: CNAME
  Name: *
  Points to: cname.vercel-dns.com
  TTL: 3600
  ```
- [ ] Save changes
- [ ] Wait for DNS propagation (up to 48 hours)

### 10. Verify DNS Propagation
- [ ] Test with `nslookup testorg.consularly.com`
- [ ] Test with online tool: https://dnschecker.org
- [ ] Verify multiple locations show correct IP
- [ ] Test from different networks

### 11. Vercel Domain Configuration
- [ ] Go to Vercel Dashboard → Project → Settings → Domains
- [ ] Add `consularly.com` (if not already added)
- [ ] Add `*.consularly.com` (wildcard)
- [ ] Verify DNS configuration
- [ ] Wait for SSL certificate provisioning
- [ ] Test HTTPS on subdomain

---

## Testing

### 12. Local Testing
- [ ] Subdomain detection works
- [ ] Organization lookup succeeds
- [ ] Cache is working (check logs)
- [ ] Branding loads correctly
- [ ] Error pages display
- [ ] Debug tools work (`window.subdomainDebug.test()`)

### 13. Staging/Production Testing
- [ ] Main portal loads at `consularly.com`
- [ ] Subdomain loads at `testorg.consularly.com`
- [ ] SSL certificate is valid
- [ ] Branding applies correctly
- [ ] Authentication works
- [ ] Cross-org access blocked
- [ ] Admin can access any subdomain
- [ ] Error pages display correctly

### 14. Access Control Testing
- [ ] Student can access own org subdomain
- [ ] Student cannot access other org subdomain
- [ ] Org member can access own org subdomain
- [ ] Org member cannot access other org subdomain
- [ ] Platform admin can access any subdomain
- [ ] Unauthenticated users see login page

### 15. Error Scenario Testing
- [ ] Visit non-existent subdomain → org-not-found page
- [ ] Visit disabled subdomain → subdomain-not-configured page
- [ ] Access wrong org subdomain → access-denied page
- [ ] Visit reserved subdomain → 404 or main portal

---

## Performance & Monitoring

### 16. Performance Verification
- [ ] Check cache hit rate (should be >90%)
- [ ] Verify middleware execution time (<50ms)
- [ ] Test page load times on subdomain
- [ ] Check Firestore query count (should be minimal)

### 17. Monitoring Setup
- [ ] Enable Vercel Analytics
- [ ] Monitor subdomain access logs
- [ ] Track error rates
- [ ] Set up alerts for high error rates

---

## Documentation & Training

### 18. Internal Documentation
- [ ] Update internal wiki with subdomain feature
- [ ] Document how to assign subdomains
- [ ] Document troubleshooting steps
- [ ] Create video tutorial (optional)

### 19. User Communication
- [ ] Prepare announcement for organizations
- [ ] Update welcome emails with subdomain info
- [ ] Create FAQ for subdomain feature
- [ ] Prepare support team with common issues

---

## Rollout Strategy

### 20. Pilot Phase
- [ ] Select 2-3 pilot organizations
- [ ] Assign subdomains to pilot orgs
- [ ] Enable subdomain access
- [ ] Monitor for issues
- [ ] Gather feedback

### 21. Gradual Rollout
- [ ] Enable for 10% of organizations
- [ ] Monitor for 1 week
- [ ] Enable for 50% of organizations
- [ ] Monitor for 1 week
- [ ] Enable for all organizations

### 22. Post-Rollout
- [ ] Monitor error logs daily for 1 week
- [ ] Address any issues promptly
- [ ] Collect user feedback
- [ ] Plan enhancements based on feedback

---

## Rollback Plan

### 23. Rollback Procedure (if needed)
- [ ] Set `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=false`
- [ ] Redeploy application
- [ ] Verify main portal still works
- [ ] Communicate with affected organizations
- [ ] Investigate and fix issues
- [ ] Re-enable when ready

---

## Success Criteria

### 24. Launch Readiness
- [ ] All critical tests passing
- [ ] DNS propagated globally
- [ ] SSL certificates valid
- [ ] No errors in production logs
- [ ] Performance metrics acceptable
- [ ] Support team trained
- [ ] Documentation complete

### 25. Post-Launch Metrics
- [ ] Track subdomain adoption rate
- [ ] Monitor error rates (<1%)
- [ ] Track user satisfaction
- [ ] Measure performance impact
- [ ] Collect feature requests

---

## Quick Reference

### Essential Commands
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Start dev server
npm run dev

# Deploy to Vercel
vercel --prod

# Test DNS
nslookup testorg.consularly.com

# Test subdomain (browser console)
window.subdomainDebug.test()
```

### Essential URLs
- Firebase Console: https://console.firebase.google.com/
- Vercel Dashboard: https://vercel.com/dashboard
- DNS Checker: https://dnschecker.org/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html

### Support Contacts
- Technical Issues: dev-team@consularly.com
- DNS/Hosting: hostinger-support@consularly.com
- User Support: support@consularly.com

---

## Notes

- **Firestore Index:** Must be deployed before enabling subdomain routing
- **DNS Propagation:** Can take up to 48 hours, but usually 1-2 hours
- **SSL Certificates:** Vercel provisions automatically, takes 5-10 minutes
- **Cache TTL:** 5 minutes, can be adjusted in `subdomain-cache.ts`
- **Reserved Subdomains:** Cannot be assigned to organizations

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Status:** Ready for deployment

