# Email Delivery Troubleshooting Guide

## Problem: Emails Sent but Not Received

If the test script shows "✅ Test email sent successfully!" but you're not receiving emails, this is a **deliverability issue**, not a sending issue.

## Common Causes

### 1. Using Gmail/Yahoo/Other Provider Addresses as Sender ❌

**Your Current Setup:**
- Sender: `consularily.mockup@gmail.com`

**Why This Fails:**
- Gmail blocks third-party services from sending emails using `@gmail.com` addresses
- Email providers (Gmail, Yahoo, Outlook) reject emails from unverified senders
- Your emails go to spam or are silently dropped

### 2. Unverified Sender Domain

Brevo requires sender verification before emails can be delivered reliably.

---

## Solutions

### ✅ Option 1: Use a Custom Domain (RECOMMENDED)

**Best for production use**

1. **Register a domain** (~$10-15/year)
   - Namecheap: https://www.namecheap.com
   - Cloudflare: https://www.cloudflare.com/products/registrar/
   - GoDaddy: https://www.godaddy.com

2. **Verify domain in Brevo**
   - Go to https://app.brevo.com/senders/domain/list
   - Click "Add a Domain"
   - Add the DNS records (SPF, DKIM, DMARC) to your domain provider
   - Wait for verification (usually 15 minutes to 24 hours)

3. **Update `.env.local`**
   ```env
   BREVO_SENDER_EMAIL=noreply@yourdomain.com
   ORG_SUPPORT_EMAIL=support@yourdomain.com
   ```

4. **Test again**
   ```bash
   npm run test:email your-email@gmail.com
   ```

**Benefits:**
- ✅ Professional appearance
- ✅ High deliverability rate
- ✅ Full control over branding
- ✅ Spam folder avoidance

---

### ✅ Option 2: Use Brevo's Default Sender (Free Plan)

**Good for testing/development**

1. **Log into Brevo dashboard**
   - Visit: https://app.brevo.com

2. **Find verified senders**
   - Go to **Senders & IPs** → **Senders**
   - Look for pre-verified senders (Brevo may provide one)

3. **Use diagnostic tool**
   ```bash
   npm run check:senders
   ```
   This will show all verified senders in your Brevo account.

4. **Update `.env.local`** with verified sender
   ```env
   BREVO_SENDER_EMAIL=your-verified-sender@example.com
   ORG_SUPPORT_EMAIL=your-verified-sender@example.com
   ```

---

### ✅ Option 3: Verify Your Current Email Address

**If you want to keep using Gmail (not recommended for production)**

1. **Go to Brevo Senders page**
   - https://app.brevo.com/senders/list

2. **Add sender**
   - Click "Add a Sender"
   - Enter: `consularily.mockup@gmail.com`
   - Check your Gmail inbox for verification email
   - Click verification link

3. **Wait for approval**
   - Brevo will review (usually instant for Gmail)
   - Status should change to "Active"

⚠️ **Warning:** Even verified Gmail addresses have lower deliverability. Use a custom domain for production.

---

## Quick Diagnostic Commands

### Check Current Configuration
```bash
npm run test:email
```
Shows configuration status (without sending email)

### Check Verified Senders
```bash
npm run check:senders
```
Lists all verified senders in your Brevo account

### Send Test Email
```bash
npm run test:email your-email@gmail.com
```
Sends actual test email to verify delivery

---

## Additional Checks

### 1. Check Spam/Junk Folder
Emails might be delivered but filtered to spam. Check:
- Gmail: Spam folder
- Outlook: Junk Email folder
- Yahoo: Spam folder

### 2. Check Brevo Email Logs
https://app.brevo.com/logs/email
- Shows delivery status for all emails
- Check for "bounced" or "blocked" status

### 3. Verify API Key
Your API key should start with `xkeysib-`
```bash
# Check your .env.local file
cat .env.local | grep BREVO_API_KEY
```

### 4. Check Email Credits
Free plan: 300 emails/day
```bash
npm run check:senders
```
Will show remaining credits

---

## DNS Records for Custom Domain (Advanced)

When using a custom domain, you'll need to add these DNS records:

### SPF Record (TXT)
```
Name: @
Type: TXT
Value: v=spf1 include:spf.sendinblue.com ~all
```

### DKIM Record (TXT)
```
Name: mail._domainkey
Type: TXT
Value: [Provided by Brevo dashboard]
```

### DMARC Record (TXT)
```
Name: _dmarc
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

Copy the exact values from Brevo dashboard during domain verification.

---

## Still Having Issues?

### Check Brevo Status
https://status.brevo.com
Verify Brevo services are operational

### Contact Brevo Support
https://help.brevo.com
Create a support ticket with:
- Your account email
- Test email message ID (from test script output)
- Recipient email address

### Verify Firewall/Network
Some corporate networks block SMTP/API calls. Test from:
- Different network (mobile hotspot)
- Different device
- Using VPN

---

## Production Checklist

Before going live with email notifications:

- [ ] Custom domain registered and verified
- [ ] SPF/DKIM/DMARC records configured
- [ ] Test emails delivered successfully
- [ ] Emails not going to spam
- [ ] Reply-to address configured
- [ ] Email templates tested on multiple clients (Gmail, Outlook, Apple Mail)
- [ ] Unsubscribe link added (if required)
- [ ] Email quota sufficient for expected volume

---

## Environment Variables Reference

```env
# Required
BREVO_API_KEY=xkeysib-your-api-key-here

# Sender configuration (use verified sender!)
BREVO_SENDER_EMAIL=noreply@yourdomain.com
ORG_SUPPORT_EMAIL=support@yourdomain.com

# Optional
BREVO_SENDER_NAME=Your Organization Name
```

---

## Next Steps

1. Run diagnostic: `npm run check:senders`
2. Choose a solution from above (Option 1 recommended)
3. Update `.env.local` with verified sender
4. Test again: `npm run test:email your-email@gmail.com`
5. Check spam folder
6. Verify in Brevo dashboard logs

---

**Last Updated:** November 11, 2024
