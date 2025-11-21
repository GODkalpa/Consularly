# Subdomain White-Labeling Setup Guide

## Overview

This guide covers the complete setup process for subdomain-based white-labeling on the Consularly platform. Organizations can access their branded portal via custom subdomains (e.g., `acmecorp.consularly.com`).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development Setup](#local-development-setup)
4. [DNS Configuration](#dns-configuration)
5. [Vercel Configuration](#vercel-configuration)
6. [Firestore Index Deployment](#firestore-index-deployment)
7. [Admin Configuration](#admin-configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ installed
- Firebase project configured
- Vercel account (for production)
- Domain registered (consularly.com)
- DNS access (Hostinger or other provider)

---

## Environment Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Subdomain Configuration
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_BASE_DOMAIN=consularly.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or production URL

# Development Mode
NEXT_PUBLIC_DEV_MODE=true  # Set to false in production
```

### Environment Variable Descriptions

- `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING`: Enable/disable subdomain routing feature
- `NEXT_PUBLIC_BASE_DOMAIN`: Your base domain (without subdomain)
- `NEXT_PUBLIC_BASE_URL`: Full base URL for API calls
- `NEXT_PUBLIC_DEV_MODE`: Enable development features and logging

---

## Local Development Setup

### Option 1: Using Hosts File (Recommended)

Edit your hosts file to map subdomains to localhost:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux:** `/etc/hosts`

Add entries:

```
127.0.0.1 acmecorp.localhost
127.0.0.1 testorg.localhost
127.0.0.1 demo.localhost
```

Then access:
- `http://acmecorp.localhost:3000`
- `http://testorg.localhost:3000`

### Option 2: Using Query Parameters

For quick testing without hosts file modification:

```
http://localhost:3000?subdomain=acmecorp
```

### Development Commands

```bash
# Start development server
npm run dev

# Test subdomain detection (in browser console)
window.subdomainDebug.test()

# Show debug information
window.subdomainDebug.show()
```

---

## DNS Configuration

### Hostinger DNS Setup

1. Log in to Hostinger control panel
2. Navigate to **Domains** → **DNS Zone Editor**
3. Add wildcard A record:

```
Type: A Record
Name: *
Points to: [Your Vercel IP or use CNAME]
TTL: 3600
```

Or use CNAME:

```
Type: CNAME
Name: *
Points to: cname.vercel-dns.com
TTL: 3600
```

### Verification

Check DNS propagation:

```bash
# Check wildcard DNS
nslookup acmecorp.consularly.com
nslookup testorg.consularly.com

# Or use online tool
# https://dnschecker.org
```

---

## Vercel Configuration

### Add Wildcard Domain

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add domains:
   - `consularly.com` (main domain)
   - `*.consularly.com` (wildcard subdomain)

3. Verify DNS configuration
4. Wait for SSL certificate provisioning (automatic)

### Vercel Environment Variables

Add in Vercel Dashboard → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
NEXT_PUBLIC_BASE_DOMAIN=consularly.com
NEXT_PUBLIC_BASE_URL=https://consularly.com
NEXT_PUBLIC_DEV_MODE=false
```

### Deploy

```bash
# Deploy to Vercel
vercel --prod

# Or use Git integration (automatic)
git push origin main
```

---

## Firestore Index Deployment

### Deploy Composite Index

The subdomain feature requires a composite index on the `organizations` collection.

```bash
# Deploy all indexes
firebase deploy --only firestore:indexes

# Or deploy specific index
firebase firestore:indexes:create \
  --collection-group=organizations \
  --field-path=subdomain \
  --order=ASCENDING \
  --field-path=subdomainEnabled \
  --order=ASCENDING
```

### Verify Index

1. Go to Firebase Console → **Firestore Database** → **Indexes**
2. Check status is "Enabled" (not "Building")
3. Wait for index build to complete (1-30 minutes depending on data size)

---

## Admin Configuration

### Assign Subdomain to Organization

#### Via Admin Dashboard

1. Log in as platform admin
2. Navigate to **Admin** → **Organizations**
3. Select organization
4. Click **Subdomain Configuration**
5. Enter subdomain (e.g., "acmecorp")
6. Click **Suggest** for auto-generated subdomain
7. Enable subdomain access
8. Save configuration

#### Via API

```bash
curl -X PATCH https://consularly.com/api/admin/organizations/{orgId}/subdomain \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "acmecorp",
    "enabled": true
  }'
```

### Subdomain Validation Rules

- 3-63 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- Must be unique across all organizations
- Cannot use reserved subdomains: `www`, `api`, `admin`, `app`, `mail`, `ftp`, `smtp`

---

## Testing

### Test Checklist

- [ ] Subdomain detection works in development
- [ ] Subdomain detection works in production
- [ ] Organization lookup by subdomain succeeds
- [ ] Branded login page displays correctly
- [ ] Authentication works on subdomain
- [ ] Dashboard branding applies correctly
- [ ] Cross-organization access is blocked
- [ ] Main portal still works at `consularly.com`
- [ ] Admin can access any subdomain
- [ ] Error pages display correctly

### Manual Testing Steps

1. **Test Main Portal**
   ```
   Visit: https://consularly.com
   Expected: Main portal loads without org branding
   ```

2. **Test Subdomain Access**
   ```
   Visit: https://acmecorp.consularly.com
   Expected: Login page with organization branding
   ```

3. **Test Organization Not Found**
   ```
   Visit: https://nonexistent.consularly.com
   Expected: "Organization Not Found" error page
   ```

4. **Test Access Control**
   ```
   1. Log in as user from Org A
   2. Visit Org B's subdomain
   Expected: "Access Denied" error page
   ```

5. **Test Admin Access**
   ```
   1. Log in as platform admin
   2. Visit any organization subdomain
   Expected: Full access granted
   ```

### Browser Console Testing

```javascript
// Test subdomain detection
await window.subdomainDebug.test()

// Show debug info
window.subdomainDebug.show()

// Get hostname info
window.subdomainDebug.info()
```

---

## Troubleshooting

### Issue: Subdomain Not Resolving

**Symptoms:** DNS_PROBE_FINISHED_NXDOMAIN error

**Solutions:**
1. Check DNS wildcard record is configured
2. Wait for DNS propagation (up to 48 hours)
3. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
4. Test with different DNS server (8.8.8.8)

### Issue: Organization Not Found

**Symptoms:** Redirected to org-not-found page

**Solutions:**
1. Verify subdomain is assigned in Firestore
2. Check `subdomainEnabled` is `true`
3. Verify Firestore index is deployed and enabled
4. Check subdomain spelling matches exactly
5. Clear subdomain cache (restart server)

### Issue: Access Denied

**Symptoms:** Redirected to access-denied page

**Solutions:**
1. Verify user's `orgId` matches subdomain's organization
2. Check user is authenticated (session cookie exists)
3. For students, verify `firebaseUid` matches and `orgId` is correct
4. For admins, verify `role` is set to `'admin'`

### Issue: Branding Not Loading

**Symptoms:** Default branding shown instead of organization branding

**Solutions:**
1. Check organization has branding configured
2. Verify API `/api/subdomain/context` returns branding
3. Clear branding cache
4. Check browser console for errors
5. Verify organization settings include `customBranding` object

### Issue: Middleware Not Running

**Symptoms:** Headers not set, subdomain detection not working

**Solutions:**
1. Check `middleware.ts` is in project root
2. Verify `config.matcher` includes your routes
3. Check `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true`
4. Restart development server
5. Check middleware logs in console

### Issue: SSL Certificate Error

**Symptoms:** "Your connection is not private" warning

**Solutions:**
1. Wait for Vercel SSL provisioning (5-10 minutes)
2. Verify wildcard domain is added in Vercel
3. Check DNS CNAME points to Vercel
4. Force SSL renewal in Vercel dashboard

### Debug Commands

```bash
# Check DNS resolution
nslookup acmecorp.consularly.com

# Test API endpoint
curl https://consularly.com/api/subdomain/lookup?subdomain=acmecorp

# Check Firestore index status
firebase firestore:indexes:list

# View middleware logs
# Check browser console or Vercel logs
```

---

## Support

For additional help:

- **Documentation:** See `SUBDOMAIN_SETUP_TUTORIAL.md`
- **Email:** support@consularly.com
- **Firestore Index:** See `SUBDOMAIN_FIRESTORE_INDEX.md`

---

## Next Steps

After setup is complete:

1. Enable subdomain for pilot organizations
2. Monitor error logs and access patterns
3. Gather feedback from organizations
4. Roll out to all organizations
5. Update welcome emails with subdomain URLs
6. Train organization admins on subdomain features

