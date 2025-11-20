# Hostinger Email Setup Guide

## Overview

This guide walks you through setting up Hostinger email service for your Consularly application with organization-specific email aliases.

## Prerequisites

- Hostinger email account with `info@consularly.com`
- Access to Hostinger email panel
- Admin access to your Consularly application

## Step 1: Configure Hostinger Email Account

### 1.1 Access Hostinger Email Panel

1. Log in to your Hostinger account
2. Navigate to **Email** section
3. Select your domain: `consularly.com`

### 1.2 Verify Main Mailbox

Ensure you have the main mailbox created:
- **Email**: `info@consularly.com`
- **Storage**: 50 GB
- **Status**: Active

### 1.3 Get SMTP Credentials

1. Click on your email account (`info@consularly.com`)
2. Go to **Email Configuration** or **SMTP Settings**
3. Note down the following:
   - **SMTP Host**: `smtp.hostinger.com`
   - **SMTP Port**: `465` (SSL/TLS)
   - **Username**: `info@consularly.com`
   - **Password**: Your email password

## Step 2: Configure Environment Variables

### 2.1 Update `.env.local`

Add the following environment variables to your `.env.local` file:

```bash
# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@consularly.com
SMTP_PASSWORD=your_actual_password_here

# Default sender (fallback)
DEFAULT_SENDER_EMAIL=info@consularly.com
DEFAULT_SENDER_NAME=Consularly
ORG_SUPPORT_EMAIL=info@consularly.com
```

### 2.2 Remove Old Brevo Variables

Remove these deprecated variables:
```bash
# Remove these:
# BREVO_API_KEY=...
# BREVO_SENDER_EMAIL=...
```

## Step 3: Create Email Aliases for Organizations

### 3.1 Generate Aliases Using Migration Script

Run the migration script to generate email aliases for all existing organizations:

```bash
npx tsx scripts/generate-email-aliases.ts
```

This will:
- Fetch all organizations from Firestore
- Generate email aliases in format: `org-{slug}@consularly.com`
- Update organization branding in database
- Display a list of aliases to create in Hostinger

### 3.2 Create Aliases in Hostinger Panel

For each generated alias (e.g., `org-acmecorp@consularly.com`):

1. Go to Hostinger Email Panel
2. Click on **Email Aliases** or **Forwarders**
3. Click **Create New Alias**
4. Fill in:
   - **Alias**: `org-acmecorp` (without @domain)
   - **Forward to**: `info@consularly.com`
5. Click **Create**

**Important**: You can create up to 50 aliases per mailbox.

### 3.3 Verify Alias Creation

Test that aliases are working:
1. Send a test email to the alias (e.g., `org-acmecorp@consularly.com`)
2. Check that it arrives in `info@consularly.com` inbox

## Step 4: Test Email Sending

### 4.1 Using Admin Dashboard

1. Log in to admin dashboard
2. Navigate to organization settings
3. Find the **Email Configuration** section
4. Click **Send Test Email**
5. Enter your email address
6. Click **Send Test**
7. Check your inbox (and spam folder)

### 4.2 Using API Endpoint

You can also test using the API:

```bash
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "orgId": "org123",
    "recipientEmail": "your-email@example.com"
  }'
```

### 4.3 Verify Email Details

Check that the test email:
- ✅ Arrives in your inbox
- ✅ Shows sender as organization's email alias
- ✅ Displays organization branding (logo, colors)
- ✅ Has correct reply-to address

## Step 5: Deploy to Production

### 5.1 Update Production Environment Variables

In your hosting platform (Vercel, etc.):

1. Go to project settings
2. Navigate to **Environment Variables**
3. Add/update:
   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=info@consularly.com
   SMTP_PASSWORD=your_password
   DEFAULT_SENDER_EMAIL=info@consularly.com
   DEFAULT_SENDER_NAME=Consularly
   ORG_SUPPORT_EMAIL=info@consularly.com
   ```
4. Remove old Brevo variables
5. Redeploy your application

### 5.2 Run Migration Script in Production

If you have new organizations in production:

```bash
# SSH into production or run via deployment script
npx tsx scripts/generate-email-aliases.ts
```

Then create the corresponding aliases in Hostinger.

## Step 6: Monitor Email Sending

### 6.1 Check Application Logs

Monitor your application logs for email sending:

```bash
# Look for these log messages:
[Email] Confirmation sent to user@example.com via org-acme@consularly.com
[Email] 24h reminder sent to user@example.com via org-acme@consularly.com
```

### 6.2 Check Hostinger Email Logs

In Hostinger panel:
1. Go to **Email Logs** or **Sent Mail**
2. Verify emails are being sent successfully
3. Check for any bounce or delivery failures

### 6.3 Monitor Firestore ReminderLogs

Check the `reminderLogs` collection in Firestore:
- Verify `emailProvider` is set to `'hostinger-smtp'`
- Check `status` field for 'sent' or 'failed'
- Review any error messages

## Troubleshooting

### Issue: SMTP Authentication Failed

**Error**: `EAUTH: SMTP authentication failed`

**Solution**:
1. Verify SMTP credentials in `.env.local`
2. Check that password is correct
3. Ensure email account is active in Hostinger
4. Try resetting email password in Hostinger panel

### Issue: Connection Timeout

**Error**: `ECONNECTION: SMTP connection failed`

**Solution**:
1. Verify SMTP host: `smtp.hostinger.com`
2. Verify SMTP port: `465`
3. Check firewall settings
4. Ensure your server can make outbound connections on port 465

### Issue: Email Not Received

**Possible causes**:
1. Check spam/junk folder
2. Verify email alias exists in Hostinger
3. Check Hostinger email logs for delivery status
4. Verify recipient email address is correct

### Issue: Wrong Sender Address

**Problem**: Emails show `info@consularly.com` instead of org alias

**Solution**:
1. Verify organization has `emailAlias` in Firestore
2. Check that alias exists in Hostinger panel
3. Regenerate alias using admin dashboard
4. Test again

## Managing Email Aliases

### Adding New Organization

When creating a new organization:

1. **Option A - Automatic** (Recommended):
   - Email alias is auto-generated when org is created
   - Create corresponding alias in Hostinger panel

2. **Option B - Manual**:
   - Use admin dashboard to generate alias
   - Create alias in Hostinger panel

### Updating Email Alias

To change an organization's email alias:

1. Go to admin dashboard
2. Navigate to organization settings
3. Enter new alias or click **Generate Email Alias**
4. Update alias in Hostinger panel (delete old, create new)

### Deleting Organization

When deleting an organization:

1. Delete organization from application
2. Optionally delete email alias from Hostinger panel
3. This frees up an alias slot (max 50)

## Best Practices

### 1. Alias Naming Convention

- Always use format: `org-{slug}@consularly.com`
- Keep slugs short and descriptive
- Use lowercase and hyphens only
- Example: `org-acme-corp@consularly.com`

### 2. Email Deliverability

- Set up SPF records for your domain
- Configure DKIM in Hostinger panel
- Set up DMARC policy
- Monitor bounce rates

### 3. Security

- Use strong password for email account
- Enable 2FA on Hostinger account
- Rotate SMTP password periodically
- Never commit credentials to git

### 4. Monitoring

- Check email logs weekly
- Monitor Firestore `reminderLogs` collection
- Set up alerts for failed emails
- Track email delivery rates

### 5. Scaling

- Current limit: 50 aliases per mailbox
- Monitor alias usage
- Plan for additional mailboxes if needed
- Consider custom domains for large clients

## Support

### Hostinger Support

- **Email**: support@hostinger.com
- **Live Chat**: Available 24/7
- **Knowledge Base**: https://support.hostinger.com

### Application Issues

- Check application logs
- Review Firestore data
- Test using admin dashboard
- Contact development team

## Appendix

### A. SMTP Configuration Reference

```
Host: smtp.hostinger.com
Port: 465 (SSL/TLS)
Port: 587 (STARTTLS) - Alternative
Authentication: Required
Username: info@consularly.com
Password: Your email password
```

### B. Email Alias Limits

- **Maximum aliases per mailbox**: 50
- **Maximum forwarders per mailbox**: 50
- **Storage per mailbox**: 50 GB
- **Emails per mailbox**: 300,000
- **Daily sending limit**: 3,000 emails per 24 hours

### C. Useful Commands

```bash
# Generate email aliases for all orgs
npx tsx scripts/generate-email-aliases.ts

# Test email sending
curl -X POST http://localhost:3000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"orgId":"org123","recipientEmail":"test@example.com"}'

# Check environment variables
curl http://localhost:3000/api/debug/env
```

### D. Migration Checklist

- [ ] Hostinger email account created
- [ ] SMTP credentials obtained
- [ ] Environment variables updated
- [ ] Migration script executed
- [ ] Email aliases created in Hostinger
- [ ] Test emails sent successfully
- [ ] Production environment updated
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] Team trained on new system
