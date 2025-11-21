# Subdomain White-Labeling - Next Steps

## Quick Start

The core subdomain infrastructure is complete! Here's what you need to do next:

### 1. Deploy Firestore Index (Required)

```bash
firebase deploy --only firestore:indexes
```

Wait for index to build (check Firebase Console → Firestore → Indexes).

### 2. Configure Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_BASE_DOMAIN=consularly.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_MODE=true
```

### 3. Test Locally

Add to hosts file:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Mac/Linux: `/etc/hosts`

```
127.0.0.1 testorg.localhost
```

Then visit: `http://testorg.localhost:3000`

### 4. Integrate SubdomainManager into Admin Dashboard

Add to your organization edit page:

```tsx
import SubdomainManager from '@/components/admin/SubdomainManager';

// In your component:
<SubdomainManager
  orgId={organization.id}
  orgName={organization.name}
  currentSubdomain={organization.subdomain}
  currentEnabled={organization.subdomainEnabled}
  onUpdate={() => refreshOrganization()}
/>
```

---

## Remaining Implementation Tasks

### High Priority (For Basic Functionality)

#### 1. Enhance Sign-In Page with Subdomain Branding

File: `src/app/signin/page.tsx`

```tsx
import { useOrgContext } from '@/hooks/useOrgContext';
import { DynamicFavicon } from '@/components/branding/DynamicFavicon';
import { DynamicStyles } from '@/components/branding/DynamicStyles';

export default function SignInPage() {
  const { context, loading } = useOrgContext();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <>
      {context?.branding && (
        <>
          <DynamicFavicon faviconUrl={context.branding.favicon} />
          <DynamicStyles branding={context.branding} />
        </>
      )}
      
      <div className="login-container">
        {context?.branding?.logoUrl && (
          <img src={context.branding.logoUrl} alt={context.orgName || 'Logo'} />
        )}
        
        <h1>{context?.orgName || 'Sign In'}</h1>
        
        {/* Your existing login form */}
        
        {!context?.branding?.whiteLabel && (
          <footer>Powered by Consularly</footer>
        )}
      </div>
    </>
  );
}
```

#### 2. Update Session Management for Subdomain Cookies

File: `src/app/api/auth/session/route.ts` (or wherever you handle sessions)

```tsx
import { extractSubdomain } from '@/lib/subdomain-utils';

// When setting session cookie:
const hostname = req.headers.get('host') || '';
const subdomain = extractSubdomain(hostname);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // Scope cookie to subdomain
  domain: subdomain 
    ? `.${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}` 
    : `.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
};

response.cookies.set('s', sessionToken, cookieOptions);
```

#### 3. Apply Branding to Dashboards

Update your dashboard pages to use subdomain context:

```tsx
import { useOrgContext } from '@/hooks/useOrgContext';
import { BrandedBackground } from '@/components/branding/BrandedBackground';
import { DynamicFavicon } from '@/components/branding/DynamicFavicon';
import { DynamicStyles } from '@/components/branding/DynamicStyles';

export default function DashboardPage() {
  const { context } = useOrgContext();
  
  return (
    <>
      {context?.branding && (
        <>
          <DynamicFavicon faviconUrl={context.branding.favicon} />
          <DynamicStyles branding={context.branding} />
          <BrandedBackground branding={context.branding} />
        </>
      )}
      
      {/* Your dashboard content */}
    </>
  );
}
```

---

### Medium Priority (For Production)

#### 4. Configure DNS Wildcard

In Hostinger (or your DNS provider):

```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 3600
```

#### 5. Configure Vercel

1. Add domains in Vercel Dashboard:
   - `consularly.com`
   - `*.consularly.com`

2. Add environment variables:
   ```
   NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
   NEXT_PUBLIC_BASE_DOMAIN=consularly.com
   NEXT_PUBLIC_BASE_URL=https://consularly.com
   NEXT_PUBLIC_DEV_MODE=false
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

#### 6. Add Subdomain Column to Organizations Table

In your admin organizations list component:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Subdomain</TableHead>
      <TableHead>Status</TableHead>
      {/* other columns */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {organizations.map(org => (
      <TableRow key={org.id}>
        <TableCell>{org.name}</TableCell>
        <TableCell>
          {org.subdomain ? (
            <a 
              href={buildSubdomainUrl(org.subdomain)} 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              {org.subdomain}
            </a>
          ) : (
            <span className="text-gray-400">Not configured</span>
          )}
        </TableCell>
        <TableCell>
          {org.subdomainEnabled ? (
            <Badge variant="success">Enabled</Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Low Priority (Enhancements)

#### 7. Error Logging Service

Create `src/services/subdomain-logger.ts`:

```tsx
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function logSubdomainError(data: {
  subdomain: string;
  errorType: 'not_found' | 'access_denied' | 'disabled';
  userId?: string;
  pathname: string;
  userAgent?: string;
  ip?: string;
}) {
  await adminDb().collection('subdomain_errors').add({
    ...data,
    timestamp: FieldValue.serverTimestamp(),
  });
}
```

#### 8. Subdomain Discovery Feature

Add to organization settings page:

```tsx
<div className="subdomain-info">
  <h3>Your Organization Subdomain</h3>
  {organization.subdomain && organization.subdomainEnabled ? (
    <div>
      <p>Access your portal at:</p>
      <a href={buildSubdomainUrl(organization.subdomain)}>
        {buildSubdomainUrl(organization.subdomain)}
      </a>
    </div>
  ) : (
    <p>Subdomain not configured. Contact your administrator.</p>
  )}
</div>
```

---

## Testing Checklist

Before going to production:

- [ ] Firestore index deployed and enabled
- [ ] Environment variables configured
- [ ] Local subdomain testing works
- [ ] SubdomainManager integrated in admin
- [ ] Can assign subdomain to organization
- [ ] Subdomain validation works
- [ ] Organization lookup by subdomain works
- [ ] Branded login page displays
- [ ] Authentication works on subdomain
- [ ] Dashboard branding applies
- [ ] Cross-org access blocked
- [ ] Main portal still works
- [ ] Admin can access any subdomain
- [ ] Error pages display correctly
- [ ] DNS wildcard configured
- [ ] Vercel domains added
- [ ] SSL certificates provisioned
- [ ] Production deployment successful

---

## Quick Commands

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Start dev server
npm run dev

# Test subdomain (in browser console)
window.subdomainDebug.test()

# Deploy to Vercel
vercel --prod

# Check DNS
nslookup testorg.consularly.com
```

---

## Documentation

- **Full Setup Guide:** `SUBDOMAIN_SETUP_GUIDE.md`
- **Implementation Summary:** `SUBDOMAIN_IMPLEMENTATION_COMPLETE.md`
- **Firestore Index:** `SUBDOMAIN_FIRESTORE_INDEX.md`
- **Original Tutorial:** `SUBDOMAIN_SETUP_TUTORIAL.md`

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check middleware logs
3. Verify Firestore index is enabled
4. Check environment variables
5. Review troubleshooting guide in `SUBDOMAIN_SETUP_GUIDE.md`

---

## Estimated Time to Complete

- **High Priority Tasks:** 2-3 hours
- **Medium Priority Tasks:** 2-3 hours
- **Low Priority Tasks:** 1-2 hours
- **Testing & Deployment:** 2-3 hours

**Total:** 1-2 days of focused development

