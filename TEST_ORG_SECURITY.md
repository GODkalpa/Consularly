# Testing Organization Security Fix

## Quick Test Guide

### Test 1: Cross-Organization Login (Should FAIL)
**Scenario:** Try to log in to Sumedha subdomain with Consulary credentials

1. Open browser and navigate to: `https://sumedha-education.consularly.com`
2. Enter Consulary organization credentials:
   - Email: `sthabiksharj0712@gmail.com` (or any Consulary user)
   - Password: (their password)
3. Click "Sign In"

**Expected Result:** ❌
- Login should fail with error message displayed on the login page
- Error: "You do not have access to this organization. Please use your organization's subdomain."
- User should remain on the login page (no redirect)
- User should be automatically signed out in the background
- No access to dashboard at all (not even for 1ms)
- No flashing or brief dashboard view

**If this fails (user gets access or sees dashboard briefly):** The security fix is not working!

---

### Test 2: Correct Organization Login (Should SUCCEED)
**Scenario:** Log in to Sumedha subdomain with Sumedha credentials

1. Open browser and navigate to: `https://sumedha-education.consularly.com`
2. Enter Sumedha organization credentials:
   - Email: (Sumedha user email)
   - Password: (their password)
3. Click "Sign In"

**Expected Result:** ✅
- Login succeeds
- User is redirected to their dashboard
- Can access all organization features

---

### Test 3: Platform Admin Access (Should SUCCEED)
**Scenario:** Platform admin can access any subdomain

1. Open browser and navigate to: `https://sumedha-education.consularly.com`
2. Enter platform admin credentials:
   - Email: (admin email with role='admin')
   - Password: (their password)
3. Click "Sign In"

**Expected Result:** ✅
- Login succeeds
- Admin can access any organization
- This is by design for platform management

---

### Test 4: Middleware Protection (Should BLOCK)
**Scenario:** If someone manually sets cookies, middleware should block

1. Open browser DevTools (F12)
2. Navigate to: `https://sumedha-education.consularly.com`
3. Manually set cookies in Console:
   ```javascript
   document.cookie = "s=1; path=/";
   document.cookie = "uid=wrong-user-id; path=/";
   document.cookie = "orgId=wrong-org-id; path=/";
   ```
4. Try to navigate to `/org` or any protected route

**Expected Result:** ❌
- Middleware detects org mismatch
- Redirects to `/access-denied` page
- All cookies are cleared
- Shows "Organization Mismatch" error

---

## Verification Checklist

- [ ] Cross-org login is blocked at session creation
- [ ] Error message is clear and helpful
- [ ] User is automatically signed out on failure
- [ ] Correct org login works normally
- [ ] Platform admins can access any org
- [ ] Middleware provides backup protection
- [ ] Access denied page shows correct message
- [ ] All cookies are cleared on denial

## Browser Console Logs to Check

When testing, open DevTools Console and look for these logs:

**Successful Login:**
```
[Session API] Login attempt: { userId: 'xxx', subdomain: 'sumedha-education', ... }
[Session API] Validating subdomain access for: sumedha-education
[Session API] Found org: { orgId: 'xxx', orgName: 'Sumedha Education' }
[Session API] User belongs to this org
[Session API] Session created with org validation
```

**Failed Login (Cross-Org):**
```
[Session API] Login attempt: { userId: 'xxx', subdomain: 'sumedha-education', ... }
[Session API] Validating subdomain access for: sumedha-education
[Session API] Found org: { orgId: 'xxx', orgName: 'Sumedha Education' }
[Session API] Access denied: User does not belong to this organization
[SignIn] Session creation failed: { code: 'ORG_ACCESS_DENIED', ... }
```

## API Testing (Optional)

You can also test the session API directly:

```bash
# Get a Firebase ID token first (from browser DevTools after login)
# Then test the session endpoint:

curl -X POST https://sumedha-education.consularly.com/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_FIREBASE_ID_TOKEN"}'

# Should return 403 if user doesn't belong to org
# Should return 200 if user belongs to org
```

## Troubleshooting

### If cross-org login still works:
1. Check `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true` in `.env.local`
2. Restart the development server
3. Clear browser cookies and cache
4. Check browser console for error logs

### If legitimate login fails:
1. Verify user's `orgId` in Firestore matches the subdomain's org
2. Check if subdomain is correctly configured in organization document
3. Verify `subdomainEnabled=true` for the organization

### If middleware doesn't block:
1. Check middleware.ts is being executed (add console.log)
2. Verify cookies are being set correctly
3. Check if route is in the middleware matcher config
