# Brevo Email Service Setup Guide

## Overview
This project uses **Brevo** (formerly Sendinblue) for transactional email delivery. Brevo provides reliable email infrastructure with excellent deliverability rates.

---

## 🚀 Quick Setup

### Step 1: Create a Brevo Account

1. Go to [Brevo.com](https://www.brevo.com/)
2. Sign up for a **free account** (includes 300 emails/day)
3. Verify your email address
4. Complete account setup

### Step 2: Get Your API Key

1. Log in to your Brevo dashboard
2. Navigate to **Settings** → **SMTP & API**
3. Click on **API Keys** tab
4. Create a new API key:
   - Name: `Consularly Production` (or appropriate name)
   - Version: v3
   - Click **Generate**
5. **Copy the API key** (you won't be able to see it again!)

### Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Brevo Email Service Configuration
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Consularly
EMAIL_REPLY_TO=support@yourdomain.com

# Application URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
```

### Step 4: Verify Your Sending Domain (Production)

For production use, verify your domain in Brevo:

1. Go to **Senders & IP** → **Domains**
2. Click **Add a Domain**
3. Enter your domain (e.g., `consularly.com`)
4. Add the provided DNS records (SPF, DKIM, DMARC) to your domain
5. Wait for verification (usually 24-48 hours)

---

## 📧 Email Types Configured

The following emails are automatically sent:

### 1. **Welcome Email** ✉️
- **Trigger:** New user signs up via `/signup`
- **To:** New user
- **Content:** Welcome message, profile setup link, getting started guide
- **File:** `src/lib/email/templates/welcome.ts`

### 2. **Account Creation Email** 🔐
- **Trigger:** Admin creates user account
- **To:** New user created by admin
- **Content:** Account details, password setup link, organization info (if applicable)
- **File:** `src/lib/email/templates/account-creation.ts`

### 3. **Organization Welcome Email** 🏢
- **Trigger:** New organization is created
- **To:** Organization admin
- **Content:** Org setup confirmation, quick start guide, branding instructions
- **File:** `src/lib/email/templates/org-welcome.ts`

### 4. **Interview Results Email** 📊
- **Trigger:** Interview is completed with final report
- **To:** Student (if email available)
- **Content:** Performance score, strengths/weaknesses, detailed report link
- **File:** `src/lib/email/templates/interview-results.ts`

### 5. **Quota Alert Emails** ⚠️
- **Trigger:** Organization reaches 75%, 90%, or 100% quota usage
- **To:** Organization admins
- **Content:** Usage statistics, upgrade options, remaining credits
- **File:** `src/lib/email/templates/quota-alert.ts`

---

## 🔧 Testing Email Service

### Test Connection in Development

Create a test script or use the email service directly:

```typescript
import { getEmailService } from '@/lib/email';

async function testEmail() {
  const emailService = getEmailService();
  const isConnected = await emailService.testConnection();
  console.log('Email service connected:', isConnected);
  
  // Send test email
  const result = await emailService.sendEmail({
    to: 'your-test-email@example.com',
    subject: 'Test Email from Consularly',
    html: '<p>This is a test email</p>',
    text: 'This is a test email',
  });
  
  console.log('Test email result:', result);
}
```

### Verify Emails in Brevo Dashboard

1. Log in to Brevo
2. Go to **Statistics** → **Email**
3. View sent emails, delivery rates, and any errors

---

## 📋 Integration Points

### User Signup Flow
**File:** `src/contexts/AuthContext.tsx`
```typescript
// After user document creation (line ~162)
sendWelcomeEmail({
  to: email,
  displayName: displayName,
  userId: user.uid,
})
```

### Admin User Creation
**File:** `src/app/api/admin/users/route.ts`
```typescript
// After password reset link generation (line ~96)
sendAccountCreationEmail({
  to: email,
  displayName,
  resetLink,
  role,
  orgName,
  createdBy: callerData?.displayName || 'Administrator',
})
```

### Organization Creation
**File:** `src/app/api/admin/organizations/route.ts`
```typescript
// After organization document creation (line ~93)
sendOrgWelcomeEmail({
  to: callerData.email,
  adminName: callerData.displayName || 'Administrator',
  orgName: name,
  orgId: ref.id,
  plan,
  quotaLimit,
})
```

### Interview Completion
**File:** `src/app/api/org/interviews/[id]/route.ts`
```typescript
// When interview status is 'completed' (line ~95)
sendInterviewResultsEmail({
  to: studentEmail,
  studentName: studentData?.name || 'Student',
  interviewType: route,
  overall: finalReport.overall || 0,
  decision: finalReport.decision || 'borderline',
  summary: finalReport.summary || 'Interview completed',
  strengths: finalReport.strengths || [],
  weaknesses: finalReport.weaknesses || [],
  reportLink: `${appUrl}/org/results?id=${interviewId}`,
  orgName: orgData?.name,
  orgBranding: orgData?.settings?.customBranding,
})
```

---

## 🎨 Email Customization

### Brand Colors
Emails use organization branding when available:
- Logo from `orgBranding.logoUrl`
- Primary color from `orgBranding.primaryColor`
- Company name from `orgBranding.companyName`

### Modify Templates
Edit template files in `src/lib/email/templates/`:
- `welcome.ts` - New user welcome
- `account-creation.ts` - Admin-created accounts
- `org-welcome.ts` - New organization setup
- `interview-results.ts` - Interview completion
- `quota-alert.ts` - Quota threshold alerts

---

## 📈 Brevo Free Tier Limits

- **300 emails per day** (free tier)
- **Unlimited contacts**
- **Email tracking** (opens, clicks)
- **SMTP and API access**

### Upgrade Plans
- **Starter:** €25/month - 20,000 emails/month
- **Business:** €65/month - 60,000 emails/month
- **Enterprise:** Custom pricing

---

## 🔒 Security Best Practices

1. **Never commit API keys to Git**
   - Keep `BREVO_API_KEY` in `.env.local` only
   - Add `.env.local` to `.gitignore`

2. **Use environment-specific keys**
   - Development key for testing
   - Production key for live emails

3. **Verify sender domain**
   - Prevents emails from going to spam
   - Improves deliverability rates

4. **Monitor bounce rates**
   - Check Brevo dashboard regularly
   - Remove invalid email addresses

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check API key is configured**
   ```bash
   echo $BREVO_API_KEY
   ```

2. **Verify Brevo account status**
   - Log in to Brevo dashboard
   - Check if account is active
   - Verify daily quota not exceeded

3. **Check application logs**
   ```bash
   # Look for email service errors
   [EmailService] ...
   ```

4. **Test API key directly**
   ```bash
   curl -X GET "https://api.brevo.com/v3/account" \
     -H "accept: application/json" \
     -H "api-key: YOUR_API_KEY"
   ```

### Emails Going to Spam

1. **Verify your sending domain** (SPF, DKIM, DMARC)
2. **Use a professional "From" address** (not @gmail.com)
3. **Avoid spam trigger words** in subject/content
4. **Include unsubscribe link** (for marketing emails)
5. **Warm up your domain** gradually increasing send volume

### Rate Limiting

If you hit the daily limit:
- **Free tier:** 300 emails/day
- **Solution:** Upgrade to paid plan or implement email queueing

---

## 📚 Additional Resources

- [Brevo Documentation](https://developers.brevo.com/)
- [Brevo API Reference](https://developers.brevo.com/reference)
- [Email Best Practices](https://www.brevo.com/blog/email-deliverability/)
- [SPF/DKIM Setup Guide](https://help.brevo.com/hc/en-us/articles/360000991960)

---

## 🎯 Next Steps

1. ✅ Create Brevo account
2. ✅ Get API key
3. ✅ Add to `.env.local`
4. ✅ Test email sending
5. ✅ Verify domain (production)
6. ✅ Monitor email deliverability
7. ⏳ Implement additional email types (quota alerts, etc.)
8. ⏳ Set up email templates in Brevo dashboard (optional)
9. ⏳ Configure webhooks for bounce/complaint handling (optional)

---

**Last Updated:** October 30, 2025  
**Version:** 1.0
