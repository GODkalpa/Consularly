# Subdomain Security Fix - Access Control

## Problem Fixed

**Before:** Any random subdomain (e.g., `random123.consularly.com`) would load the site and allow login with any user account.

**After:** 
- Only registered organization subdomains work
- Users can only access their own organization's subdomain
- Students can only access the org they belong to
- Cross-org access is blocked

## Changes Made

### 1. Strict Subdomain Validation

**File:** `middleware.ts`

- Non-existent subdomains now return **404** instead of redirecting
- Users logged into Org A cannot access Org B's subdomain
- Session cookies are cleared when access is denied

### 2. Enhanced Access Control

**File:** `src/app/api/subdomain/validate-access/route.ts`

- Added detailed logging for access attempts
- Explicitly checks user's orgId matches subdomain's orgId
- Students are validated against `orgStudents` collection

## How It Works Now

### Scenario 1: Random Subdomain
```
User visits: https://randomxyz.consularly.com
Result: 404 - Organization not found
```

### Scenario 2: Valid Subdomain, Wrong User
```
User: john@orgA.com (logged in)
Visits: https://orgB.consularly.com
Result: 403 - Access denied, session cleared
```

### Scenario 3: Valid Subdomain, Correct User
```
User: john@orgA.com (logged in)
Visits: https://orgA.consularly.com
Result: ✅ Access granted
```

### Scenario 4: Student Access
```
Student: student@example.com (belongs to orgA)
Visits: https://orgA.consularly.com
Result: ✅ Access granted

Same student visits: https://orgB.consularly.com
Result: 403 - Access denied
```

### Scenario 5: Platform Admin
```
Admin: admin@consularly.com
Visits: ANY subdomain
Result: ✅ Access granted (admins can access all orgs)
```

## Security Features

### 1. Organization Isolation
- Each org's subdomain is completely isolated
- Users cannot cross-access other organizations
- Student data is scoped to their organization

### 2. Session Management
- Invalid access attempts clear session cookies
- Forces re-authentication on the correct subdomain
- Prevents session hijacking across orgs

### 3. Validation Layers

**Layer 1: Subdomain Exists**
- Check if subdomain is registered in database
- Return 404 if not found

**Layer 2: Subdomain Enabled**
- Check if organization has subdomain feature enabled
- Return 403 if disabled

**Layer 3: User Belongs to Org**
- Validate user's orgId matches subdomain's orgId
- Check student records for student users
- Allow platform admins to access all orgs

## Testing

### Test 1: Non-existent Subdomain
```bash
curl -I https://doesnotexist.consularly.com
# Expected: 404 Not Found
```

### Test 2: Valid Subdomain, No Login
```bash
curl -I https://testorg.consularly.com
# Expected: 200 OK (public pages)
# Protected pages: Redirect to /signin
```

### Test 3: Cross-Org Access
1. Login to Org A subdomain
2. Try to access Org B subdomain
3. Expected: 403 Access Denied, cookies cleared

### Test 4: Student Access
1. Login as student of Org A
2. Access Org A subdomain: ✅ Works
3. Try Org B subdomain: ❌ Denied

## Environment Variables

Make sure this is set in `.env.local`:
```env
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
```

## Database Requirements

### Organizations Collection
Each org document must have:
```typescript
{
  id: string
  subdomain: string  // unique subdomain
  subdomainEnabled: boolean
  name: string
}
```

### Users Collection
Each user document must have:
```typescript
{
  id: string
  orgId: string  // organization they belong to
  role: 'admin' | 'org' | 'student'
}
```

### OrgStudents Collection
Each student document must have:
```typescript
{
  firebaseUid: string  // user ID
  orgId: string  // organization they belong to
  email: string
}
```

## Logging

Access attempts are logged with:
- Timestamp
- Subdomain
- Organization ID
- User ID
- Action (success/denied/not_found)
- IP address
- User agent

Check server logs for:
```
[Subdomain Access] {"timestamp":"...","subdomain":"testorg","action":"access_denied"}
[Validate Access] User abc123 belongs to org xyz789, not org456
```

## Common Issues

### Issue: User can still access wrong subdomain
**Solution:** Clear browser cookies and try again. Old session cookies might be cached.

### Issue: 404 on valid subdomain
**Solution:** 
1. Check organization exists in Firestore
2. Verify `subdomain` field matches URL
3. Ensure `subdomainEnabled` is `true`

### Issue: Admin cannot access subdomains
**Solution:** Verify user's `role` field is set to `'admin'` in Firestore

## Next Steps

Consider adding:
1. Rate limiting for failed access attempts
2. Email notifications for suspicious access
3. Audit log in Firestore for compliance
4. IP-based blocking for repeated violations
5. Two-factor authentication for sensitive orgs

## Deployment

After deploying these changes:
1. Test with multiple organizations
2. Verify cross-org access is blocked
3. Test student access isolation
4. Monitor logs for access patterns
5. Clear Vercel cache if needed

---

**Status:** ✅ Implemented and tested
**Security Level:** High - Multi-layer validation
**Performance:** Cached lookups, minimal database queries
