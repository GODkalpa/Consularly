# DNS Troubleshooting for Subdomain Feature

## Current Issue

Vercel shows "Invalid Configuration" for `*.consularly.com` even though DNS records appear correct in Hostinger.

## Root Cause

Your domain is using Hostinger's parking nameservers (`ns1.dns-parking.com`, `ns2.dns-parking.com`) which may not properly support wildcard CNAME records for external services.

## Solution Options

### Option 1: Change to Vercel Nameservers (Simplest)

**Steps:**
1. In Hostinger → DNS / Nameservers → Click "Change Nameservers"
2. Replace with:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. In Vercel → Add all your DNS records (email, etc.)
4. Wait 1-2 hours for propagation

**Pros:**
- Wildcard subdomains work automatically
- Vercel manages SSL certificates
- Faster DNS resolution

**Cons:**
- Must migrate all DNS records to Vercel
- Lose Hostinger DNS control

### Option 2: Keep Hostinger + Fix Records (Current Approach)

**Required DNS Records in Hostinger:**

```
# Root domain
Type: A
Name: @
Value: 76.76.21.21
TTL: 14400

# WWW subdomain
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 14400

# Wildcard for all subdomains
Type: CNAME
Name: *
Value: cname.vercel-dns.com
TTL: 14400
```

**Verification Steps:**

1. **Check DNS propagation:**
   ```bash
   # Windows
   nslookup testorg.consularly.com
   nslookup demo.consularly.com
   
   # Mac/Linux
   dig testorg.consularly.com
   dig demo.consularly.com
   ```

2. **Expected result:**
   Should return Vercel's IP addresses (76.76.21.21 or similar)

3. **If not working:**
   - Wait longer (DNS can take up to 48 hours)
   - Clear DNS cache:
     ```bash
     # Windows
     ipconfig /flushdns
     
     # Mac
     sudo dscacheutil -flushcache
     
     # Linux
     sudo systemd-resolve --flush-caches
     ```

4. **Test from different location:**
   Use online tool: https://dnschecker.org
   - Enter: `testorg.consularly.com`
   - Check if it resolves globally

### Option 3: Hybrid Approach (Recommended)

Use Cloudflare as DNS proxy (free):

1. **Add domain to Cloudflare (free plan)**
2. **Change nameservers to Cloudflare:**
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
3. **In Cloudflare DNS:**
   ```
   Type: CNAME
   Name: *
   Value: cname.vercel-dns.com
   Proxy: OFF (DNS only)
   ```
4. **Keep all other records (email, etc.)**

**Pros:**
- Wildcard works reliably
- Keep control of DNS
- Free SSL, DDoS protection
- Faster DNS resolution

**Cons:**
- One more service to manage

## Current Status Check

Based on your screenshots:

✅ Hostinger DNS has wildcard CNAME
✅ Hostinger DNS has www CNAME
❌ Vercel shows "Invalid Configuration"
❌ Nameservers are still Hostinger parking

## Recommended Action

**For fastest resolution:**

1. **Change nameservers to Vercel** (if you don't need Hostinger DNS)
   OR
2. **Wait 24-48 hours** for DNS propagation with current setup
   OR
3. **Use Cloudflare** as DNS provider (best of both worlds)

## Testing Commands

```bash
# Test if wildcard is working
nslookup testorg.consularly.com
nslookup demo.consularly.com
nslookup anything.consularly.com

# Test main domain
nslookup consularly.com
nslookup www.consularly.com

# Check nameservers
nslookup -type=ns consularly.com

# Check CNAME
nslookup -type=cname testorg.consularly.com
```

## Expected Timeline

- **Nameserver change:** 1-2 hours (up to 48 hours)
- **DNS record change:** 15 minutes to 4 hours
- **Vercel SSL provisioning:** 5-10 minutes after DNS resolves

## Vercel Configuration

Once DNS is working:

1. In Vercel → Domains → `*.consularly.com`
2. Click "Refresh" to force DNS check
3. Wait for SSL certificate provisioning
4. Status should change to "Valid Configuration"

## Temporary Workaround

While waiting for DNS:

1. **Test locally with hosts file:**
   ```
   # Add to hosts file
   127.0.0.1 testorg.consularly.com
   ```

2. **Test with Vercel preview URL:**
   Your deployment should have a URL like:
   `your-project-abc123.vercel.app`

3. **Enable subdomain routing in dev:**
   ```env
   NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING=true
   ```
   Then test: `http://testorg.localhost:3000`

## Support

If still not working after 48 hours:

1. **Contact Hostinger Support:**
   - Ask them to verify wildcard CNAME is properly configured
   - Ask if parking nameservers support wildcard CNAMEs

2. **Contact Vercel Support:**
   - Show them your DNS configuration
   - Ask them to manually verify the domain

3. **Consider Cloudflare:**
   - Free, reliable, and works well with Vercel
   - Many developers use this combination

## Quick Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| Only using Vercel | Change to Vercel nameservers |
| Using Hostinger email | Keep Hostinger, wait for DNS |
| Need reliability | Use Cloudflare DNS |
| Testing only | Use localhost with hosts file |

