# Subdomain White-Labeling Setup Tutorial

## Overview

This tutorial will guide you through setting up wildcard subdomain support for your Consularly.com domain. After completing these steps, organizations will be able to access their branded portals at URLs like `acmecorp.consularly.com`, `testorg.consularly.com`, etc.

**What you'll accomplish:**
- Configure DNS in Hostinger to route all subdomains to Vercel
- Configure Vercel to accept wildcard subdomains
- Verify SSL certificates are working
- Test subdomain routing

**Time required:** 15-30 minutes

---

## Part 1: Hostinger DNS Configuration

### Step 1: Log into Hostinger

1. Go to https://www.hostinger.com/
2. Click **Login** (top right)
3. Enter your credentials
4. You should see your dashboard

### Step 2: Access DNS Settings

1. In the Hostinger dashboard, look for **Domains** in the left sidebar
2. Click on **Domains**
3. Find **consularly.com** in your domain list
4. Click on **Manage** next to consularly.com
5. Look for **DNS / Name Servers** or **DNS Zone** section
6. Click on **DNS Zone** or **Manage DNS**

You should now see a list of DNS records (A records, CNAME records, etc.)

### Step 3: Find Your Vercel DNS Target

Before adding the wildcard record, you need to know where to point it. You have two options:

**Option A: Use Vercel's CNAME (Recommended)**
- Target: `cname.vercel-dns.com`
- This is easier and more flexible

**Option B: Use Vercel's A Record**
- You'll need to get the IP address from Vercel (we'll do this in Part 2)

For now, let's proceed with **Option A (CNAME)** as it's simpler.

### Step 4: Add Wildcard DNS Record

1. In the DNS Zone editor, look for a button that says **Add Record** or **Add New Record**
2. Click **Add Record**
3. Fill in the following:

   **Type:** Select **CNAME**
   
   **Name:** Enter `*` (just the asterisk symbol)
   
   **Points to / Target / Value:** Enter `cname.vercel-dns.com`
   
   **TTL:** Leave as default (usually 3600 or 14400)

4. Click **Save** or **Add Record**

### Step 5: Verify the Record Was Added

After saving, you should see a new record in your DNS list that looks like:

```
Type: CNAME
Name: *
Points to: cname.vercel-dns.com
TTL: 3600
```

**Important Notes:**
- Some DNS providers show the full domain, so it might display as `*.consularly.com` instead of just `*`
- DNS changes can take 5 minutes to 48 hours to propagate (usually 15-30 minutes)
- Don't delete your existing DNS records for `@` (root domain) or `www`

### Step 6: Keep Existing Records

Make sure you still have these records (don't delete them):

```
Type: A or CNAME
Name: @ (or blank, or consularly.com)
Points to: [Your Vercel IP or CNAME]

Type: CNAME
Name: www
Points to: [Your Vercel domain or CNAME]
```

These ensure your main domain (`consularly.com` and `www.consularly.com`) still work.

---

## Part 2: Vercel Configuration

### Step 1: Log into Vercel

1. Go to https://vercel.com/
2. Click **Login**
3. Sign in with your account
4. You should see your dashboard with your projects

### Step 2: Open Your Project

1. Find your Consularly project in the project list
2. Click on the project name to open it
3. You should see your project dashboard with deployments

### Step 3: Access Domain Settings

1. Click on **Settings** tab (top navigation)
2. In the left sidebar, click on **Domains**
3. You should see your current domain configuration

### Step 4: Check Current Domain Setup

You should already have `consularly.com` configured. If not, add it first:

1. Click **Add** or **Add Domain**
2. Enter `consularly.com`
3. Click **Add**
4. Follow Vercel's instructions to verify the domain

### Step 5: Add Wildcard Domain

Now add the wildcard subdomain:

1. In the Domains section, click **Add** or **Add Domain**
2. Enter: `*.consularly.com` (with the asterisk and dot)
3. Click **Add**

**What happens next:**

Vercel will show you one of these scenarios:

**Scenario A: "Valid Configuration"**
- Vercel detects your DNS is configured correctly
- SSL certificate will be automatically provisioned
- You're done! ✅

**Scenario B: "Invalid Configuration"**
- Vercel shows DNS instructions
- Follow the instructions (usually asking you to add a CNAME record)
- Go back to Hostinger and verify your wildcard CNAME record is correct

**Scenario C: "Pending Verification"**
- Vercel is checking your DNS
- Wait 5-10 minutes and refresh the page
- DNS propagation may still be in progress

### Step 6: Verify SSL Certificate

Once Vercel accepts the wildcard domain:

1. Look for a **green checkmark** or **"Valid Configuration"** status next to `*.consularly.com`
2. Check for **SSL certificate status** - it should say "Active" or show a lock icon
3. Vercel automatically provisions SSL certificates using Let's Encrypt

**If SSL is pending:**
- Wait 5-10 minutes for automatic provisioning
- Refresh the page
- SSL certificates usually provision within 10 minutes

### Step 7: Configure Domain Settings (Optional)

In the Domains section, you can configure:

1. **Redirect www to non-www** (or vice versa) - optional
2. **Git Branch** - which branch deploys to which domain
3. **Production Domain** - set your primary domain

For subdomains, the default settings are usually fine.

---

## Part 3: Testing Your Configuration

### Step 1: Wait for DNS Propagation

After configuring DNS in Hostinger:

1. Wait at least **15-30 minutes** for DNS changes to propagate
2. DNS can take up to 48 hours in rare cases, but usually it's much faster

### Step 2: Test DNS Resolution

**Option A: Online DNS Checker**

1. Go to https://dnschecker.org/
2. Enter: `test.consularly.com` (or any subdomain)
3. Select **CNAME** from the dropdown
4. Click **Search**
5. You should see `cname.vercel-dns.com` as the result across multiple locations

**Option B: Command Line (Windows)**

Open Command Prompt and run:

```cmd
nslookup test.consularly.com
```

You should see something like:

```
Non-authoritative answer:
test.consularly.com    canonical name = cname.vercel-dns.com
```

**Option C: Command Line (Mac/Linux)**

Open Terminal and run:

```bash
dig test.consularly.com
```

Look for a CNAME record pointing to `cname.vercel-dns.com`

### Step 3: Test Subdomain Access

Once DNS is propagated and Vercel shows "Valid Configuration":

1. Open your browser
2. Visit: `https://test.consularly.com`
3. You should see your Consularly application (same as the main site for now)
4. Check the SSL certificate:
   - Click the **lock icon** in the address bar
   - Verify the certificate is valid
   - It should say "Issued by: Let's Encrypt" or similar

**Expected behavior (before code implementation):**
- The subdomain loads your application
- SSL certificate is valid (green lock)
- The page looks the same as `consularly.com` (this is normal - we haven't implemented subdomain detection yet)

**If you see an error:**
- "This site can't be reached" → DNS not propagated yet, wait longer
- "SSL certificate error" → Certificate not provisioned yet, wait 10 minutes
- "404 Not Found" → This is actually OK! It means routing is working

### Step 4: Test Multiple Subdomains

Try accessing different subdomains to verify wildcard routing:

- `https://acmecorp.consularly.com`
- `https://demo.consularly.com`
- `https://test123.consularly.com`

All should load (even if they show the same content or 404 - that's expected before code implementation).

---

## Part 4: Vercel Hobby Plan Considerations

### Wildcard Domain Support

Good news! **Vercel Hobby plan supports wildcard domains** (`*.consularly.com`). This feature is available on all Vercel plans including the free Hobby plan.

### SSL Certificates

- Vercel automatically provisions SSL certificates for wildcard domains
- Uses Let's Encrypt (free, automatic renewal)
- No additional configuration needed
- Certificates renew automatically before expiration

### Limitations to Be Aware Of

On Vercel Hobby plan:

1. **Bandwidth**: 100GB/month (should be sufficient for most use cases)
2. **Build Time**: 6000 minutes/month
3. **Serverless Function Execution**: 100GB-hours/month
4. **No Custom SSL**: Can't upload your own SSL certificate (but Let's Encrypt works great)

For subdomain white-labeling, these limits are usually fine unless you have very high traffic.

---

## Part 5: Troubleshooting

### Issue: "Domain is not configured correctly" in Vercel

**Solution:**

1. Go back to Hostinger DNS settings
2. Verify the wildcard CNAME record exists: `* → cname.vercel-dns.com`
3. Check for typos in the CNAME target
4. Wait 30 minutes for DNS propagation
5. Try removing and re-adding the domain in Vercel

### Issue: DNS not propagating

**Solution:**

1. Check DNS propagation status: https://dnschecker.org/
2. Wait longer (can take up to 48 hours, usually 15-30 minutes)
3. Clear your browser cache and DNS cache:
   - Windows: `ipconfig /flushdns` in Command Prompt
   - Mac: `sudo dscacheutil -flushcache` in Terminal
4. Try accessing from a different network or device

### Issue: SSL certificate not provisioning

**Solution:**

1. Verify DNS is fully propagated first (SSL won't provision until DNS works)
2. Wait 10-15 minutes after DNS propagation
3. In Vercel, try removing and re-adding the wildcard domain
4. Check Vercel status page: https://www.vercel-status.com/

### Issue: Subdomain shows "This site can't be reached"

**Solution:**

1. DNS not propagated yet - wait longer
2. Check DNS configuration in Hostinger
3. Verify CNAME record is correct: `* → cname.vercel-dns.com`
4. Test DNS resolution using `nslookup` or online tools

### Issue: Main domain (consularly.com) stops working

**Solution:**

1. Check that you didn't delete the root domain DNS records
2. You should have both:
   - `@ → [Vercel IP or CNAME]` (for consularly.com)
   - `* → cname.vercel-dns.com` (for subdomains)
3. Re-add the root domain record if missing

### Issue: "Too many redirects" error

**Solution:**

1. Check Vercel domain settings for redirect loops
2. Ensure you don't have conflicting redirect rules
3. Clear browser cache and cookies
4. Try accessing in incognito/private mode

---

## Part 6: Verification Checklist

Before proceeding with code implementation, verify:

- [ ] Wildcard CNAME record exists in Hostinger DNS (`* → cname.vercel-dns.com`)
- [ ] Vercel shows "Valid Configuration" for `*.consularly.com`
- [ ] SSL certificate is active in Vercel (green checkmark)
- [ ] Test subdomain loads in browser (e.g., `https://test.consularly.com`)
- [ ] SSL certificate is valid (green lock in browser)
- [ ] Main domain still works (`https://consularly.com`)
- [ ] DNS propagation is complete (check with dnschecker.org)

---

## Part 7: What Happens Next

### After Infrastructure Setup

Once you've completed the above steps and verified everything works:

1. **Infrastructure is ready** ✅
2. **Code implementation can begin**
3. I'll implement the 38 tasks from the spec
4. Subdomains will start showing organization-specific branding

### Current Behavior (Before Code Implementation)

Right now, all subdomains will:
- Load your application
- Show the same content as the main domain
- Have valid SSL certificates
- This is expected and correct!

### After Code Implementation

After I implement the code:
- `acmecorp.consularly.com` → Shows Acme Corp's branded login and dashboard
- `testorg.consularly.com` → Shows Test Org's branded login and dashboard
- Each organization gets their own isolated experience
- Students can only access their organization's subdomain

---

## Part 8: Quick Reference

### Hostinger DNS Record

```
Type: CNAME
Name: *
Points to: cname.vercel-dns.com
TTL: 3600 (or default)
```

### Vercel Domain Configuration

```
Domain: *.consularly.com
Status: Valid Configuration
SSL: Active
```

### Testing Commands

**Windows (Command Prompt):**
```cmd
nslookup test.consularly.com
```

**Mac/Linux (Terminal):**
```bash
dig test.consularly.com
```

**Online Tool:**
https://dnschecker.org/

---

## Need Help?

If you get stuck at any step:

1. **Take a screenshot** of the error or configuration screen
2. **Note which step** you're on
3. **Share the details** and I can help troubleshoot

Common questions:
- "Where do I find DNS settings in Hostinger?" → Domains → Manage → DNS Zone
- "What's the CNAME target?" → `cname.vercel-dns.com`
- "How long does DNS take?" → Usually 15-30 minutes, up to 48 hours
- "Is wildcard free on Vercel Hobby?" → Yes! ✅

---

## Summary

**What you did:**
1. ✅ Added wildcard CNAME record in Hostinger (`* → cname.vercel-dns.com`)
2. ✅ Added wildcard domain in Vercel (`*.consularly.com`)
3. ✅ Verified SSL certificate is active
4. ✅ Tested subdomain access

**What's next:**
1. Wait for me to implement the code (38 tasks)
2. Test subdomain branding with real organizations
3. Deploy to production
4. Organizations can start using their branded subdomains!

**You're ready to proceed with code implementation!** 🎉
