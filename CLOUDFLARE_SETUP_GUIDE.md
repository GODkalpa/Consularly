# Cloudflare Setup for Wildcard SSL

## Why Cloudflare?

Vercel cannot provision wildcard SSL certificates with Hostinger nameservers. Cloudflare solves this problem and provides additional benefits:

- ✅ Free wildcard SSL certificates
- ✅ Works perfectly with Vercel
- ✅ Faster DNS resolution
- ✅ DDoS protection
- ✅ Keep all your email records
- ✅ Easy to manage

## Step-by-Step Setup (30 minutes)

### Step 1: Sign Up for Cloudflare (5 min)

1. Go to https://cloudflare.com
2. Click "Sign Up"
3. Create free account
4. Verify email

### Step 2: Add Your Domain (5 min)

1. Click "Add a Site"
2. Enter: `consularly.com`
3. Click "Add Site"
4. Select **"Free" plan** (scroll down)
5. Click "Continue"

### Step 3: Review DNS Records (5 min)

Cloudflare will automatically scan and import your existing DNS records from Hostinger.

**Verify these records exist:**

1. **Root domain:**
   ```
   Type: A
   Name: @
   Value: 216.198.79.1 (or your Vercel IP)
   Proxy: OFF (DNS only - gray cloud)
   ```

2. **WWW:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   Proxy: OFF (DNS only - gray cloud)
   ```

3. **Wildcard:**
   ```
   Type: CNAME
   Name: *
   Value: cname.vercel-dns.com
   Proxy: OFF (DNS only - gray cloud)
   ```

4. **Email records (MX, TXT, etc.):**
   - Should be imported automatically
   - Verify all email records are present

**Important:** Make sure Proxy is **OFF** (gray cloud icon) for Vercel records!

Click "Continue" when done.

### Step 4: Change Nameservers in Hostinger (5 min)

Cloudflare will show you 2 nameservers like:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**In Hostinger:**

1. Go to **DNS / Nameservers**
2. Click **"Change Nameservers"**
3. Select **"Use custom nameservers"**
4. Enter Cloudflare's nameservers:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
5. Click **"Save"** or **"Change Nameservers"**

### Step 5: Wait for Propagation (1-2 hours)

Cloudflare will check nameserver status automatically.

**You'll receive an email when:**
- Nameservers are updated
- Cloudflare is active
- SSL certificate is issued

**Check status:**
- Cloudflare Dashboard → Overview
- Should show "Active" status

### Step 6: Configure SSL in Cloudflare (2 min)

1. In Cloudflare Dashboard → **SSL/TLS**
2. Set SSL mode to: **"Full (strict)"**
3. This ensures end-to-end encryption

### Step 7: Verify in Vercel (5 min)

Once Cloudflare is active:

1. Go to Vercel Dashboard → Domains
2. Click **"Refresh"** on `*.consularly.com`
3. Should now show **"Valid Configuration"** ✅
4. SSL certificate will be issued automatically

### Step 8: Test Everything (5 min)

```bash
# Test DNS
nslookup testorg.consularly.com

# Test SSL
curl -I https://testorg.consularly.com

# Visit in browser
https://testorg.consularly.com
```

Should show:
- ✅ 🔒 Secure connection
- ✅ Valid SSL certificate
- ✅ Page loads correctly

---

## Cloudflare Settings

### Recommended Settings:

**SSL/TLS:**
- Mode: Full (strict)
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON

**Speed:**
- Auto Minify: ON (HTML, CSS, JS)
- Brotli: ON

**Caching:**
- Caching Level: Standard

**Security:**
- Security Level: Medium
- Bot Fight Mode: ON (optional)

---

## DNS Records Reference

### Required Records for Vercel:

```
# Root domain
Type: A
Name: @
Value: 216.198.79.1
Proxy: OFF

# WWW
Type: CNAME
Name: www
Value: cname.vercel-dns.com
Proxy: OFF

# Wildcard for subdomains
Type: CNAME
Name: *
Value: cname.vercel-dns.com
Proxy: OFF
```

### Email Records (from Hostinger):

```
# MX Records
Type: MX
Name: @
Value: mail.hostinger.com
Priority: 10

# SPF
Type: TXT
Name: @
Value: v=spf1 include:_spf.hostinger.com ~all

# DKIM (if you have it)
Type: TXT
Name: default._domainkey
Value: [your DKIM key]

# DMARC
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@consularly.com
```

---

## Troubleshooting

### Issue: Nameservers Not Updating

**Solution:**
- Wait up to 24 hours
- Check status: `nslookup -type=ns consularly.com`
- Contact Hostinger support if stuck

### Issue: SSL Not Working

**Solution:**
- Make sure Proxy is OFF (gray cloud) for Vercel records
- Set SSL mode to "Full (strict)"
- Wait 10 minutes for SSL provisioning
- Clear browser cache

### Issue: Email Stopped Working

**Solution:**
- Verify all MX records are in Cloudflare
- Check SPF, DKIM, DMARC records
- Test email: https://mxtoolbox.com

### Issue: Vercel Still Shows Invalid

**Solution:**
- Wait for Cloudflare to be fully active
- Click "Refresh" in Vercel
- Remove and re-add `*.consularly.com` in Vercel

---

## Benefits of Cloudflare

### Performance:
- Faster DNS resolution (1.1.1.1)
- Global CDN
- Automatic caching

### Security:
- DDoS protection
- Bot mitigation
- SSL/TLS encryption

### Reliability:
- 100% uptime SLA
- Automatic failover
- Real-time monitoring

### Cost:
- **FREE forever**
- No credit card required
- Unlimited DNS queries

---

## Timeline

- **Cloudflare signup:** 5 minutes
- **Add domain:** 5 minutes
- **Change nameservers:** 5 minutes
- **Propagation:** 1-2 hours
- **SSL provisioning:** 5-10 minutes
- **Total:** 2-3 hours

---

## Alternative: Vercel Nameservers

If you don't want to use Cloudflare, you can use Vercel nameservers directly:

1. Add all DNS records in Vercel first
2. Change nameservers to:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. Wait for propagation
4. SSL works automatically

**Pros:**
- One less service to manage
- Direct integration

**Cons:**
- No DDoS protection
- No CDN benefits
- Less flexible DNS management

---

## Recommendation

**Use Cloudflare.** It's free, reliable, and solves all your SSL issues while providing additional benefits. Most developers use Cloudflare + Vercel together.

---

## Support

- **Cloudflare Docs:** https://developers.cloudflare.com
- **Cloudflare Community:** https://community.cloudflare.com
- **Vercel + Cloudflare Guide:** https://vercel.com/docs/concepts/projects/domains/cloudflare

