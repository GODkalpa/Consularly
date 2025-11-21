# Fix SSL Certificate for Wildcard Subdomain

## Current Status

✅ DNS is working - `testorg.consularly.com` resolves correctly
✅ Site is accessible - Page loads
❌ SSL certificate not provisioned - Shows "Not secure"
❌ Vercel shows "Invalid Configuration" for `*.consularly.com`

## Root Cause

Vercel hasn't fully validated the wildcard domain yet, so SSL certificate hasn't been provisioned.

## Solution: Remove and Re-add Wildcard Domain

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** → **Domains**

2. **Remove Wildcard Domain**
   - Find `*.consularly.com` (shows "Invalid Configuration")
   - Click **"Edit"** or the three dots menu
   - Click **"Remove"** or **"Delete"**
   - Confirm removal

3. **Wait 30 Seconds**
   - Let Vercel clear the old configuration

4. **Add Wildcard Domain Again**
   - Click **"Add Domain"** button
   - Enter: `*.consularly.com`
   - Click **"Add"**

5. **Vercel Will Verify**
   - Vercel checks DNS automatically
   - Should show "Valid Configuration" ✅
   - If it shows "Invalid Configuration" again:
     - Wait 5 minutes
     - Click "Refresh" button
     - Try again

6. **Wait for SSL Certificate**
   - Vercel auto-provisions SSL certificate
   - Takes 5-10 minutes
   - You'll see a notification when ready
   - Status will show certificate details

7. **Verify SSL is Working**
   - Visit: `https://testorg.consularly.com`
   - Should show 🔒 secure padlock
   - No "Not secure" warning

## Alternative: Manual SSL Provisioning

If automatic provisioning fails:

1. **In Vercel Domains**
   - Click on `*.consularly.com`
   - Look for **"Renew Certificate"** button
   - Click it to force provisioning

2. **Check Certificate Status**
   - Should show: "Certificate provisioned"
   - Shows expiry date
   - Shows certificate authority (Let's Encrypt)

## Troubleshooting

### Issue: Still Shows "Invalid Configuration"

**Possible causes:**
1. DNS not fully propagated globally
2. Vercel cache issue
3. Nameserver issue

**Solutions:**
1. Wait 1 hour and try again
2. Contact Vercel support
3. Consider changing to Vercel nameservers

### Issue: SSL Certificate Not Provisioning

**Possible causes:**
1. Domain not fully validated
2. DNS CAA records blocking Let's Encrypt
3. Rate limit reached

**Solutions:**

1. **Check CAA Records in Hostinger:**
   - Go to DNS records
   - Look for CAA records
   - If exists, make sure it allows Let's Encrypt:
     ```
     Type: CAA
     Name: @
     Value: 0 issue "letsencrypt.org"
     ```

2. **Wait and Retry:**
   - Let's Encrypt has rate limits
   - Wait 1 hour and try again

3. **Contact Vercel Support:**
   - Provide domain name
   - Mention SSL not provisioning
   - They can manually trigger it

## Expected Timeline

- **Remove domain:** Instant
- **Re-add domain:** Instant
- **DNS verification:** 1-2 minutes
- **SSL provisioning:** 5-10 minutes
- **Total:** 10-15 minutes

## Verification Commands

```bash
# Check if SSL certificate is issued
curl -I https://testorg.consularly.com

# Should show:
# HTTP/2 200
# (not HTTP/1.1 or connection error)

# Check certificate details
openssl s_client -connect testorg.consularly.com:443 -servername testorg.consularly.com

# Should show Let's Encrypt certificate
```

## What You Should See After Fix

### In Vercel Dashboard:
```
*.consularly.com
✅ Valid Configuration
🔒 Certificate: Let's Encrypt
   Expires: [date]
```

### In Browser:
```
🔒 https://testorg.consularly.com
   Secure connection
   Certificate valid
```

## If All Else Fails

### Option 1: Change to Vercel Nameservers

This gives Vercel full control and SSL works immediately:

1. In Hostinger → Change nameservers to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. Migrate all DNS records to Vercel
3. Wait 1-2 hours for propagation
4. SSL will work automatically

### Option 2: Use Cloudflare

Cloudflare provides free SSL and works well with Vercel:

1. Add domain to Cloudflare (free plan)
2. Change nameservers to Cloudflare
3. Add DNS records in Cloudflare
4. Enable "Full (strict)" SSL mode
5. Cloudflare handles SSL automatically

## Current Action Required

**Right now, do this:**

1. Go to Vercel Dashboard
2. Remove `*.consularly.com`
3. Wait 30 seconds
4. Add `*.consularly.com` again
5. Wait 10 minutes
6. Test: `https://testorg.consularly.com`

**Expected result:** 🔒 Secure connection!

---

**Status:** DNS working, waiting for SSL
**Action:** Remove and re-add wildcard domain in Vercel
**Time:** 10-15 minutes

