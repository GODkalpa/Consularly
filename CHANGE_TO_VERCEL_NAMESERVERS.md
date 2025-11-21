# Change to Vercel Nameservers - Step by Step

## ⚠️ Important: Backup Current DNS Records First

Before changing nameservers, **save all your current DNS records** from Hostinger:

### Current DNS Records to Migrate:

1. **Email Records (MX, TXT, CNAME)**
   - MX records for mail delivery
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
   - Any email-related CNAMEs

2. **Other Records**
   - Any A records
   - Any CNAME records
   - Any TXT records (verification, etc.)

## Steps to Change Nameservers

### Step 1: Export Current DNS from Hostinger

1. Go to Hostinger → DNS / Nameservers → **DNS records** tab
2. Take screenshots or write down ALL records
3. Pay special attention to:
   - MX records (for email)
   - TXT records (SPF, DKIM, DMARC)
   - Any CNAME records

### Step 2: Add Domain to Vercel

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `consularly.com`
4. Vercel will show you the nameservers to use:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### Step 3: Add DNS Records in Vercel

Before changing nameservers, add all your DNS records in Vercel:

1. In Vercel → **Domains** → Click on `consularly.com`
2. Go to **DNS Records** section
3. Add each record from Hostinger:

**Example Email Records:**
```
Type: MX
Name: @
Value: mail.hostinger.com
Priority: 10

Type: TXT
Name: @
Value: v=spf1 include:_spf.hostinger.com ~all

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@consularly.com
```

### Step 4: Change Nameservers in Hostinger

1. Go to Hostinger → DNS / Nameservers
2. Click **"Change Nameservers"**
3. Select **"Use custom nameservers"**
4. Enter:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
5. Click **"Save"** or **"Change Nameservers"**

### Step 5: Wait for Propagation

- **Time:** 1-2 hours (up to 48 hours)
- **Check status:** Use `nslookup -type=ns consularly.com`

### Step 6: Verify Everything Works

1. **Test website:** https://consularly.com
2. **Test subdomain:** https://testorg.consularly.com
3. **Test email:** Send test email to your domain
4. **Check Vercel:** Status should show "Valid Configuration"

## Rollback Plan

If something goes wrong:

1. Go back to Hostinger
2. Click "Change Nameservers"
3. Select "Use Hostinger nameservers" or enter:
   ```
   ns1.dns-parking.com
   ns2.dns-parking.com
   ```
4. Wait for propagation

## Email Considerations

⚠️ **Critical:** Make sure you migrate ALL email-related DNS records to Vercel before changing nameservers, or email will stop working!

### Required Email Records:

1. **MX Records** - Mail delivery
2. **SPF (TXT)** - Sender verification
3. **DKIM (TXT)** - Email authentication
4. **DMARC (TXT)** - Email policy
5. **Any email CNAMEs** - Webmail, SMTP, etc.

## Timeline

- **Nameserver change:** 1-2 hours
- **DNS propagation:** 1-24 hours
- **SSL certificate:** 5-10 minutes after DNS
- **Total:** 2-24 hours

## Recommendation

**Don't change nameservers yet.** Your current DNS setup is correct. Just wait 24 hours for propagation.

If still not working after 24 hours, then consider changing nameservers.

