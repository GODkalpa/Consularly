# Firebase Subdomain Authorization Setup

## Issue
Firebase OAuth operations (like Google Sign-In) require domains to be authorized in the Firebase console.

Error message:
```
The current domain is not authorized for OAuth operations. 
Add your domain (sumedha-education.consularly.com) to the OAuth redirect domains list.
```

## Solution

### 1. Add Subdomain to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **visa-mockup**
3. Navigate to **Authentication** → **Settings** → **Sign-in method**
4. Scroll down to **Authorized domains**
5. Click **Add domain**
6. Add your subdomain pattern:
   - For specific subdomain: `sumedha-education.consularly.com`
   - For all subdomains (wildcard): `*.consularly.com`

### 2. Recommended Setup

Add BOTH:
- `consularly.com` (main domain)
- `*.consularly.com` (all subdomains)

This allows:
- Main portal login at `consularly.com`
- Organization logins at `org-name.consularly.com`
- Any future subdomains automatically work

### 3. Localhost for Development

Make sure these are also added for development:
- `localhost`
- `127.0.0.1`

### 4. Verify Setup

After adding domains:
1. Wait 1-2 minutes for changes to propagate
2. Try logging in on subdomain
3. Google Sign-In should now work

## Current Authorized Domains

Based on your project, you should have:
- ✅ `localhost` (for development)
- ✅ `consularly.com` (main domain)
- ❌ `*.consularly.com` (ADD THIS for all subdomains)
- ❌ `sumedha-education.consularly.com` (or add wildcard above)

## Note

The wildcard `*.consularly.com` is the recommended approach as it covers:
- `sumedha-education.consularly.com`
- `consulary.consularly.com`
- Any future organization subdomains

You won't need to add each subdomain individually.
