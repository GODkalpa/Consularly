# Email Service Test Guide

## Quick Test - Just Check Configuration

To verify your Brevo email service is configured correctly (without sending an actual email):

```bash
npm run test:email
```

This will check:
- ✅ Environment variables are set (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`)
- ✅ Brevo API connection is working
- ✅ Your account status and email credits
- ⚠️ Will NOT send an actual test email (safe to run)

---

## Full Test - Send Test Email

To verify email sending AND receive a test email in your inbox:

```bash
npm run test:email your-email@example.com
```

Replace `your-email@example.com` with your actual email address.

**Example:**
```bash
npm run test:email john@example.com
```

This will:
1. Check environment variables
2. Test Brevo API connection
3. Send a real test email to the address you provided
4. Show you the message ID

**⚠️ Check your spam/junk folder if you don't see it!**

---

## Expected Output

### Successful Configuration Test

```
============================================================
   EMAIL SERVICE TEST - Brevo Configuration Check
============================================================

ℹ️  Step 1: Checking environment variables...
✅ BREVO_API_KEY found (xkeysib-8f3...)
✅ BREVO_SENDER_EMAIL found (noreply@yourdomain.com)
✅ ORG_SUPPORT_EMAIL found (support@yourdomain.com)

ℹ️  Step 2: Initializing Brevo client...
✅ Brevo client initialized

ℹ️  Step 3: Testing Brevo API connection...
✅ Successfully connected to Brevo API!
ℹ️     Account: your-email@example.com
ℹ️     Plan: free
ℹ️     Email credits remaining: 289

ℹ️  Step 4: Test email sending
⚠️  No test email provided. Skipping test email send.
ℹ️  To send a test email, run:
ℹ️     npm run test:email your-email@example.com

============================================================
✅ Email configuration is valid! ✨
============================================================
```

### Successful Test Email Send

```
============================================================
   EMAIL SERVICE TEST - Brevo Configuration Check
============================================================

ℹ️  Step 1: Checking environment variables...
✅ BREVO_API_KEY found (xkeysib-8f3...)
✅ BREVO_SENDER_EMAIL found (noreply@yourdomain.com)

ℹ️  Step 2: Initializing Brevo client...
✅ Brevo client initialized

ℹ️  Step 3: Testing Brevo API connection...
✅ Successfully connected to Brevo API!
ℹ️     Account: your-email@example.com
ℹ️     Plan: free
ℹ️     Email credits remaining: 289

ℹ️  Step 4: Test email sending
ℹ️  Step 5: Sending test email to john@example.com...
✅ Test email sent successfully!
ℹ️     Message ID: <abc123@smtp-relay.brevo.com>
ℹ️     Check your inbox at: john@example.com
⚠️     Don't forget to check your spam/junk folder!

============================================================
✅ All tests passed! Your email service is ready! 🎉
============================================================
```

---

## Common Errors & Solutions

### Error: BREVO_API_KEY is missing

**Solution:**
Add your Brevo API key to `.env.local`:

```env
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
```

Get your API key from: [Brevo Dashboard → Settings → SMTP & API → API Keys](https://app.brevo.com/settings/keys/api)

### Error: Invalid API key (401)

**Causes:**
- API key is incorrect
- API key has been deleted/revoked
- Wrong environment (development vs production key)

**Solution:**
1. Generate a new API key in Brevo dashboard
2. Copy it exactly (no extra spaces)
3. Update `.env.local`
4. Restart your dev server

### Error: Failed to send test email

**Possible causes:**
- Invalid sender email format
- Sender email not verified in Brevo
- Daily quota exceeded (300 emails/day for free tier)
- Recipient email is invalid

**Solution:**
1. Verify your domain in Brevo (production)
2. Check Brevo dashboard for delivery status
3. Ensure sender email follows proper format

---

## What This Means for Interview Scheduling

Once the test passes, these emails will be sent automatically:

| Event | Email Type | When |
|-------|-----------|------|
| Student assigned to slot | ✉️ Confirmation | Immediately |
| Interview rescheduled | 🔄 Reschedule notice | Immediately |
| Interview cancelled | ❌ Cancellation | Immediately |
| Interview approaching | ⏰ 24h reminder | 24 hours before |
| Interview starting soon | ⏰ 1h reminder | 1 hour before |

All emails include:
- ✨ Your organization's branding (logo, colors, company name)
- 📅 Interview details (date, time, timezone)
- 🎯 Interview type (USA F1, UK Student, etc.)
- 📝 Professional HTML template
- 🔗 Support contact information

---

## Troubleshooting Tips

### Emails go to spam

1. **Verify your domain** in Brevo (adds SPF/DKIM records)
2. **Use a professional sender** (e.g., `noreply@yourcompany.com`, not `@gmail.com`)
3. **Warm up your domain** by sending small batches first
4. **Check spam score** in Brevo dashboard

### Test passes but students don't get emails

1. **Check server logs** when scheduling:
   - Look for: `[Email] Confirmation sent to...`
   - Or: `[Email] Brevo API key not configured`
2. **Verify `.env.local` in production**:
   - If deploying, ensure env vars are set on hosting platform
3. **Check Firestore**:
   - Slot document should have `remindersSent.confirmation: true`

### Low email credits warning

**Free tier:** 300 emails/day

**If you need more:**
- **Starter:** €25/month - 20,000 emails/month
- **Business:** €65/month - 60,000 emails/month

Upgrade at: [Brevo Plans](https://www.brevo.com/pricing/)

---

## Next Steps

1. ✅ Run `npm run test:email` to verify configuration
2. ✅ Send yourself a test email: `npm run test:email your-email@example.com`
3. ✅ Check your inbox (and spam folder)
4. ✅ Schedule a test interview from Org Dashboard
5. ✅ Verify the student receives confirmation email

---

## Reference Files

- **Email Service:** `src/lib/email-service.ts`
- **Test Script:** `scripts/test-email.ts`
- **API Integration:** `src/app/api/org/slots/route.ts`
- **Setup Guide:** `BREVO_EMAIL_SETUP.md`
- **Fix Documentation:** `EMAIL_NOTIFICATION_FIX.md`

---

**Last Updated:** November 11, 2025  
**Script Location:** `scripts/test-email.ts`
