# Vercel Deployment Fix - Cron Job Issue

## Problem
Vercel deployment was failing because the cron job configuration violated Hobby plan limits.

## Root Cause
**Vercel Hobby Plan Limits:**
- Maximum 2 cron jobs per account
- Cron jobs can only be triggered **once per day**

**Our Configuration:**
```json
"schedule": "0 * * * *"  // Runs every hour (24 times/day) ❌
```

This violated the "once per day" limit, causing deployment failures.

## Solution Applied
Changed the cron schedule to run once daily:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"  // Runs once daily at 9 AM UTC ✅
    }
  ]
}
```

### Schedule Explanation
- `0 9 * * *` = At 9:00 AM UTC every day
- This sends both 24-hour and 1-hour reminders in a single daily run
- Adjust the hour (9) to match your preferred time zone

## Alternative Solutions

### Option 1: Remove Cron Jobs (Temporary)
If reminders aren't critical right now:
```json
{}
```

### Option 2: Upgrade to Pro Plan
- **Pro Plan**: 40 cron jobs, unlimited invocations
- **Cost**: ~$20/month
- Allows hourly reminders: `0 * * * *`

### Option 3: Use External Cron Service
- Use services like cron-job.org or EasyCron
- Call your API endpoint from external service
- Free tier available on most services

## Reminder Logic Update Needed

Since we're now running once daily instead of hourly, update the reminder logic in:
`src/app/api/cron/send-reminders/route.ts`

The endpoint should:
1. Find all slots in the next 24 hours → send 24h reminders
2. Find all slots in the next 1 hour → send 1h reminders
3. Both in a single execution

Current implementation already handles this correctly with the time-based queries.

## Deployment Steps

1. Commit the vercel.json change:
   ```bash
   git add vercel.json
   git commit -m "Fix: Change cron to daily schedule for Hobby plan compliance"
   git push origin main
   ```

2. Vercel will auto-deploy the new configuration

3. Verify in Vercel dashboard:
   - Go to Project Settings → Cron Jobs
   - Confirm schedule shows "0 9 * * *"
   - Check deployment succeeds

## Environment Variables Check

Ensure these are set in Vercel dashboard (Project Settings → Environment Variables):

**Required:**
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `ORG_SUPPORT_EMAIL`
- `CRON_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (or individual Firebase Admin vars)
- All `NEXT_PUBLIC_FIREBASE_*` variables
- Cloudinary variables (if using branding features)

**Missing env vars will also cause deployment failures.**

## Testing

After deployment succeeds:

1. **Manual Test:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/send-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Check Logs:**
   - Vercel Dashboard → Deployments → [Latest] → Functions
   - Look for `/api/cron/send-reminders` execution logs

3. **Verify Emails:**
   - Create test interview slots for tomorrow
   - Wait for 9 AM UTC (or trigger manually)
   - Check if reminder emails are sent

## Monitoring

- Cron jobs appear in Vercel Dashboard → Cron Jobs tab
- View execution history and logs
- Set up alerts for failed executions

## Notes

- Daily reminders are sufficient for most use cases
- Users will receive reminders at consistent times
- Reduces API calls and email quota usage
- Complies with Hobby plan limits

---

**Status**: ✅ Fixed - Ready to deploy
**Date**: 2025-01-11
**Plan**: Hobby (Free)
