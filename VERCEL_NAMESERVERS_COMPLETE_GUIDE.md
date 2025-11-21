# Complete Guide: Migrate to Vercel Nameservers for Wildcard Domains

## Why This Guide?

Vercel **requires** nameservers for wildcard domains (`*.consularly.com`). The CNAME method with Cloudflare doesn't work for wildcards according to Vercel's official documentation.

---

## Part 1: Backup Current DNS Records (5 minutes)

### Step 1: Export DNS from Cloudflare

1. Go to **Cloudflare Dashboard** → Select `consularly.com`
2. Click **DNS** → **Records**
3. Take screenshots or write down ALL records:

**Current Records to Save:**
```
A     @              76.76.21.21
CNAME *              cname.vercel-dns.com
CNAME www            cname.vercel-dns.com (or the 821aac... one)
MX    @              mx1.hostinger.com (priority 5)
MX    @              mx2.hostinger.com (priority 10)
TXT   @              v=spf1 include:_spf.mail.hostinger.com ~all
TXT   _dmarc         v=DMARC1; p=none
```

**Important:** Save ALL records, especially email (MX, SPF, DMARC) or email will stop working!

---

## Part 2: Add Domain to Vercel (10 minutes)

### Step 2: Add Root Domain First

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your project (the one with your Next.js app)
3. Click **Settings** (top navigation)
4. Click **Domains** (left sidebar)
5. Click **"Add Domain"** button
6. Enter: `consularly.com` (without www or *)
7. Click **"Add"**

**Vercel will show:**
- "Invalid Configuration" (expected - nameservers not changed yet)
- A message about nameservers

### Step 3: Add Wildcard Domain

1. Still in **Domains** section
2. Click **"Add Domain"** again
3. Enter: `*.consularly.com`
4. Click **"Add"**

**Vercel will automatically:**
- Detect it's a wildcard domain
- Enable "Nameservers" method
- Show you the nameservers to use

### Step 4: Get Vercel Nameservers

After adding the wildcard domain:

1. Click on `*.consularly.com` in the domains list
2. Look for **"Nameservers"** section
3. You'll see something like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
   (The exact names might be slightly different)

**Write these down!** You'll need them in Part 3.

---

## Part 3: Add DNS Records in Vercel (15 minutes)

### Step 5: Access Vercel DNS Management

1. In Vercel Dashboard → Your Project → **Domains**
2. Click on `consularly.com` (the root domain, not wildcard)
3. Scroll down to find **"DNS Records"** section
   - If you don't see it, the domain might need to be in "Nameservers" mode first
   - Try clicking "Edit" on the domain and selecting "Nameservers" method

**Alternative way to access DNS:**
1. Go to: https://vercel.com/dashboard
2. Click your username/team name (top right)
3. Click **"Domains"** (if available in menu)
4. Select `consularly.com`
5. Look for **"DNS Records"** or **"Manage DNS"**

### Step 6: Add Email Records (Critical!)

Add these records one by one:

**MX Records (for receiving email):**
```
Type: MX
Name: @ (or leave blank for root)
Value: mx1.hostinger.com
Priority: 5
TTL: Auto
```

```
Type: MX
Name: @
Value: mx2.hostinger.com
Priority: 10
TTL: Auto
```

**SPF Record (for sending email):**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.mail.hostinger.com ~all
TTL: Auto
```

**DMARC Record (email policy):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
TTL: Auto
```

### Step 7: Add Other Records (if you have any)

If you have other DNS records in Cloudflare (like verification records, other subdomains, etc.), add them too.

**Note:** You don't need to add:
- A record for `@` (Vercel handles this automatically)
- CNAME for `*` (Vercel handles wildcard automatically)
- CNAME for `www` (Vercel handles this automatically)

---

## Part 4: Change Nameservers in Hostinger (10 minutes)

### Step 8: Login to Hostinger

1. Go to: https://hostinger.com
2. Login to your account
3. Go to **Domains** section
4. Find `consularly.com`
5. Click **"Manage"** or the domain name

### Step 9: Change Nameservers

1. Look for **"DNS / Nameservers"** or **"Nameservers"** tab
2. Click **"Change Nameservers"**
3. Select **"Use custom nameservers"** or **"Change nameservers"**
4. Remove Cloudflare nameservers:
   ```
   OLD (remove these):
   arely.ns.cloudflare.com
   dave.ns.cloudflare.com
   ```
5. Enter Vercel nameservers (from Step 4):
   ```
   NEW (add these):
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
6. Click **"Save"** or **"Change Nameservers"**

**Hostinger will show a warning** that this will affect your DNS. That's expected - click "Confirm" or "Continue".

---

## Part 5: Wait for Propagation (1-2 hours)

### Step 10: Monitor Nameserver Change

**Check nameserver status:**

Open PowerShell and run:
```powershell
nslookup -type=ns consularly.com
```

**Initially shows (Cloudflare):**
```
arely.ns.cloudflare.com
dave.ns.cloudflare.com
```

**After propagation (Vercel):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Timeline:**
- First check: 15 minutes after change
- Usually works: 1-2 hours
- Maximum: 24-48 hours (rare)

### Step 11: Monitor Vercel Status

1. Go to Vercel Dashboard → Domains
2. Watch the status of `*.consularly.com`
3. Initially: "Invalid Configuration" (nameservers not detected yet)
4. After propagation: "Valid Configuration" ✅
5. SSL certificate: Provisions automatically (5-10 minutes after validation)

---

## Part 6: Verify Everything Works (10 minutes)

### Step 12: Test DNS Resolution

```powershell
# Test root domain
nslookup consularly.com

# Test www
nslookup www.consularly.com

# Test wildcard subdomain
nslookup testorg.consularly.com

# All should return Vercel IPs (76.76.21.x or similar)
```

### Step 13: Test HTTPS

Open browser and visit:
- `https://consularly.com` → Should work ✅
- `https://www.consularly.com` → Should work ✅
- `https://testorg.consularly.com` → Should work ✅

**Look for:**
- 🔒 Secure padlock in browser
- No certificate errors
- Page loads correctly

### Step 14: Test Email

**Send a test email to your domain:**
```
your-email@consularly.com
```

**Check:**
- Email arrives (receiving works)
- Can send from your email (sending works)

If email doesn't work, check MX records in Vercel DNS.

---

## Part 7: Cleanup (5 minutes)

### Step 15: Remove Domain from Cloudflare (Optional)

Since you're no longer using Cloudflare:

1. Go to Cloudflare Dashboard
2. Select `consularly.com`
3. Click **"Overview"**
4. Scroll down to **"Advanced Actions"**
5. Click **"Remove Site from Cloudflare"**

**Or keep it:** You can leave the domain in Cloudflare (inactive) in case you want to switch back later.

---

## Troubleshooting

### Issue: Nameservers Not Changing

**Solution:**
- Wait longer (can take up to 48 hours)
- Clear DNS cache: `ipconfig /flushdns`
- Check with different DNS checker: https://dnschecker.org
- Contact Hostinger support if stuck after 48 hours

### Issue: Vercel Still Shows "Invalid Configuration"

**Solution:**
- Wait for nameservers to fully propagate
- Click "Refresh" button in Vercel
- Remove and re-add the wildcard domain after nameservers propagate

### Issue: Email Stopped Working

**Solution:**
- Check MX records in Vercel DNS
- Make sure you added:
  - `mx1.hostinger.com` (priority 5)
  - `mx2.hostinger.com` (priority 10)
- Wait for DNS propagation
- Test with: https://mxtoolbox.com

### Issue: SSL Certificate Not Provisioning

**Solution:**
- Wait 10-15 minutes after "Valid Configuration" shows
- Vercel provisions SSL automatically
- If still not working after 1 hour, contact Vercel support

### Issue: Subdomain Not Working

**Solution:**
- Check DNS: `nslookup testorg.consularly.com`
- Should return Vercel IP
- If not, nameservers haven't propagated yet
- Wait longer and test again

---

## What You Get After Migration

✅ **Wildcard domains work** - `*.consularly.com` fully functional
✅ **Automatic SSL** - HTTPS works for all subdomains
✅ **No configuration headaches** - Vercel handles everything
✅ **Fast DNS** - Vercel's DNS is globally distributed
✅ **Email works** - MX records properly configured
✅ **One less service** - No need to manage Cloudflare

---

## Timeline Summary

| Step | Time | Status Check |
|------|------|--------------|
| Backup DNS | 5 min | Screenshots saved |
| Add domains to Vercel | 10 min | Domains added |
| Add DNS records | 15 min | Records configured |
| Change nameservers | 10 min | Nameservers updated |
| **Wait for propagation** | **1-2 hours** | Check with nslookup |
| Verify & test | 10 min | Everything works |
| **Total** | **2-3 hours** | ✅ Complete |

---

## Quick Reference: DNS Records to Add in Vercel

```
# Email (Hostinger)
MX    @        mx1.hostinger.com       Priority: 5
MX    @        mx2.hostinger.com       Priority: 10
TXT   @        v=spf1 include:_spf.mail.hostinger.com ~all
TXT   _dmarc   v=DMARC1; p=none

# Vercel handles these automatically:
# - A record for @ (root domain)
# - CNAME for www
# - CNAME for * (wildcard)
```

---

## Need Help?

**Vercel Support:**
- Email: support@vercel.com
- Discord: https://vercel.com/discord
- Docs: https://vercel.com/docs/concepts/projects/domains

**Hostinger Support:**
- Live chat in Hostinger dashboard
- Email: support@hostinger.com

**Check DNS Propagation:**
- https://dnschecker.org
- https://whatsmydns.net

---

## Final Notes

- **Backup first** - Always save current DNS records before changing
- **Email is critical** - Double-check MX records are added in Vercel
- **Be patient** - DNS propagation takes time (1-2 hours typically)
- **Test thoroughly** - Verify website, subdomains, and email all work
- **Keep Cloudflare account** - You can always switch back if needed

**This is the official Vercel method for wildcard domains and will work reliably.**
