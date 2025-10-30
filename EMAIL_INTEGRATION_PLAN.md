# Email Service Integration Plan

## Overview
This document outlines all potential email integration points across the Consularly visa interview platform, from user signups to organizational workflows.

---

## 📧 Email Service Provider Recommendations

**Recommended Services:**
1. **SendGrid** - Robust, easy to integrate, good free tier
2. **Resend** - Modern, developer-friendly, great for Next.js
3. **AWS SES** - Cost-effective for high volume
4. **Postmark** - Excellent deliverability, transaction-focused

**Environment Variables Needed:**
```env
# Email Service Configuration
EMAIL_PROVIDER=sendgrid # or resend, ses, postmark
EMAIL_API_KEY=your_api_key_here
EMAIL_FROM_ADDRESS=noreply@consularly.com
EMAIL_FROM_NAME=Consularly
EMAIL_REPLY_TO=support@consularly.com

# Optional: Template IDs if using pre-built templates
EMAIL_TEMPLATE_WELCOME=d-xxxxx
EMAIL_TEMPLATE_PASSWORD_RESET=d-xxxxx
EMAIL_TEMPLATE_ORG_INVITE=d-xxxxx
```

---

## 🔐 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 User Signup (`src/contexts/AuthContext.tsx:134-172`)
**Current:** Creates user account, sends password reset email via Firebase
**Email Needed:**
- ✅ **Welcome Email** - Personalized onboarding message
  - Include getting started guide
  - Link to profile setup
  - Platform features overview
  - Support contact information

**Integration Point:**
```typescript
// After line 159 in AuthContext.tsx
await sendWelcomeEmail({
  to: email,
  displayName: displayName,
  userId: user.uid
});
```

### 1.2 Password Reset (`src/components/auth/AuthModal.tsx:65-81`)
**Current:** Uses Firebase sendPasswordResetEmail
**Enhancement:**
- ✅ **Custom Password Reset Email** - Branded email with custom template
  - Organization branding (if user belongs to org)
  - Security tips
  - Alternative contact methods

**Integration Point:**
```typescript
// Replace/supplement Firebase email with custom branded email
await sendPasswordResetEmail({
  to: email,
  resetLink: customResetLink,
  orgBranding: userOrgBranding // if applicable
});
```

### 1.3 Admin-Created Users (`src/app/api/admin/users/route.ts:54-78`)
**Current:** Generates password reset link, returned in API response
**Email Needed:**
- ✅ **Account Creation Notification** - Email with account details
  - Welcome message from admin/organization
  - Password setup instructions
  - Platform access details
  - First-time login guide

**Integration Point:**
```typescript
// After line 78 in route.ts
if (resetLink) {
  await sendAccountCreationEmail({
    to: email,
    displayName: displayName,
    resetLink: resetLink,
    role: role,
    orgName: orgId ? await getOrgName(orgId) : null,
    createdBy: callerData.displayName
  });
}
```

---

## 🏢 2. ORGANIZATION MANAGEMENT

### 2.1 New Organization Creation (`src/app/api/admin/organizations/route.ts:23-90`)
**Current:** Creates organization document
**Email Needed:**
- ✅ **Organization Welcome Email** - Sent to admin who created org
  - Organization setup confirmation
  - Quick start guide for admins
  - Link to organization dashboard
  - Branding customization guide
  - Student management instructions
  - Quota information

**Integration Point:**
```typescript
// After line 88 in route.ts
await sendOrganizationWelcomeEmail({
  to: callerData.email,
  adminName: callerData.displayName,
  orgName: name,
  orgId: ref.id,
  plan: plan,
  quotaLimit: quotaLimit
});
```

### 2.2 Organization Member Invitation
**Current:** Admin creates user accounts for org members
**Email Needed:**
- ✅ **Organization Invitation Email** - Invite members to join
  - Organization name and details
  - Role assignment
  - Access instructions
  - Password setup link
  - Organization dashboard link

**Integration Point:**
```typescript
// In /api/admin/users/route.ts when orgId is assigned
if (orgId && role === 'user') {
  await sendOrgInvitationEmail({
    to: email,
    memberName: displayName,
    orgName: await getOrgName(orgId),
    invitedBy: callerData.displayName,
    resetLink: resetLink,
    orgDashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/org`
  });
}
```

### 2.3 Quota Alerts
**Current:** Shows quota in dashboard, no proactive alerts
**Email Needed:**
- ✅ **Quota Warning Emails** - Proactive notifications at thresholds
  - **75% usage:** "Approaching quota limit"
  - **90% usage:** "Quota limit nearly reached"
  - **100% usage:** "Quota limit reached - upgrade needed"
  - Include usage statistics
  - Upgrade/purchase options
  - Contact information for quota increase

**Integration Point:**
```typescript
// Create new function in /api/org/interviews/route.ts
async function checkAndNotifyQuota(orgId: string, quotaUsed: number, quotaLimit: number) {
  const percentage = (quotaUsed / quotaLimit) * 100;
  
  if (percentage >= 75 && percentage < 80) {
    await sendQuotaAlertEmail({
      orgId,
      threshold: '75%',
      quotaUsed,
      quotaLimit,
      severity: 'warning'
    });
  }
  // Similar for 90% and 100%
}
```

---

## 👥 3. STUDENT MANAGEMENT

### 3.1 Student Account Creation (`src/app/api/org/students/route.ts:71-123`)
**Current:** Creates database record for student
**Email Needed:**
- ✅ **Student Welcome Email** - If student has email
  - Welcome to organization's interview prep program
  - Access instructions
  - Interview preparation resources
  - Contact information
  - Organization branding

**Integration Point:**
```typescript
// After line 116 in route.ts
if (email) {
  const orgData = await getOrganizationData(orgId);
  await sendStudentWelcomeEmail({
    to: email,
    studentName: name,
    orgName: orgData.name,
    orgBranding: orgData.settings?.customBranding,
    interviewCountry: interviewCountry
  });
}
```

### 3.2 Student Profile Updates
**Email Needed:**
- ✅ **Profile Completion Reminder** - If profile incomplete
  - Importance of complete profile
  - Link to profile setup
  - Deadline if applicable

---

## 🎤 4. INTERVIEW WORKFLOW

### 4.1 Interview Scheduled/Started
**Email Needed:**
- ✅ **Interview Initiated Email** - Confirmation when interview starts
  - To: Student (if email available)
  - Interview type (USA F1, UK, France)
  - Start timestamp
  - Expected duration
  - Good luck message

**Integration Point:**
```typescript
// In /api/org/interviews/route.ts after interview creation
if (studentEmail) {
  await sendInterviewStartEmail({
    to: studentEmail,
    studentName: studentName,
    interviewType: route,
    startedAt: new Date().toISOString(),
    orgName: orgData.name
  });
}
```

### 4.2 Interview Completion (`src/app/api/interview/final/route.ts`)
**Current:** Generates final report and scores
**Email Needed:**
- ✅ **Interview Results Email** - Detailed performance report
  - To: Student (if email available)
  - CC: Organization admin
  - Overall score and decision
  - Strengths and weaknesses summary
  - Detailed insights
  - Recommendations for improvement
  - Link to full report
  - Option to schedule follow-up

**Integration Point:**
```typescript
// After final report is saved to Firestore
await sendInterviewResultsEmail({
  to: studentEmail,
  cc: orgAdminEmails,
  studentName: studentProfile.name,
  overall: finalReport.overall,
  decision: finalReport.decision,
  summary: finalReport.summary,
  reportLink: `${process.env.NEXT_PUBLIC_APP_URL}/org/results?id=${interviewId}`,
  orgBranding: orgBranding
});
```

### 4.3 Interview Failed/Technical Issues
**Email Needed:**
- ✅ **Technical Issue Notification** - Alert when interview fails
  - To: Student and admin
  - Issue description
  - Troubleshooting steps
  - Rebooking instructions
  - Support contact

---

## 📊 5. REPORTING & ANALYTICS

### 5.1 Weekly/Monthly Organization Reports
**Email Needed:**
- ✅ **Analytics Digest Email** - Periodic performance summaries
  - To: Organization admins
  - Total interviews conducted
  - Average scores
  - Success rate trends
  - Top performing students
  - Areas needing attention
  - Quota usage
  - Link to full dashboard

**Integration Point:**
```typescript
// Create new scheduled job (e.g., using Vercel Cron or similar)
// /api/cron/weekly-reports/route.ts
export async function GET() {
  const orgs = await getAllActiveOrganizations();
  
  for (const org of orgs) {
    const analytics = await getWeeklyAnalytics(org.id);
    await sendWeeklyReportEmail({
      to: org.adminEmails,
      orgName: org.name,
      analytics: analytics,
      period: 'weekly'
    });
  }
}
```

### 5.2 Individual Student Progress Reports
**Email Needed:**
- ✅ **Student Progress Email** - After multiple interviews
  - To: Student
  - Progress over time
  - Score improvements
  - Strengths development
  - Areas still needing work
  - Milestone achievements

---

## ⚠️ 6. ALERTS & NOTIFICATIONS

### 6.1 System Notifications
**Email Needed:**
- ✅ **System Maintenance Alerts** - Scheduled downtime
- ✅ **Feature Updates** - New features announcement
- ✅ **Security Alerts** - Unusual login attempts

### 6.2 Admin Alerts
**Email Needed:**
- ✅ **New User Registration** - When student self-registers (if enabled)
- ✅ **Quota Threshold Alerts** - As mentioned in 2.3
- ✅ **Failed Interview Alerts** - Technical issues during interviews
- ✅ **Payment/Billing Alerts** - If implementing paid features

---

## 🛠️ IMPLEMENTATION STRUCTURE

### Recommended File Structure:
```
src/
  lib/
    email/
      index.ts              # Main email service client
      providers/
        sendgrid.ts         # SendGrid implementation
        resend.ts           # Resend implementation
      templates/
        welcome.ts          # Welcome email template
        password-reset.ts   # Password reset template
        org-welcome.ts      # Organization welcome
        interview-results.ts # Results email
        quota-alert.ts      # Quota notifications
        weekly-report.ts    # Analytics digest
      utils/
        branding.ts         # Apply org branding to emails
        formatting.ts       # Email formatting helpers
  
  app/
    api/
      email/
        send/
          route.ts          # Generic email sending endpoint
        unsubscribe/
          route.ts          # Email unsubscribe handler
```

### Core Email Service Interface:
```typescript
// src/lib/email/index.ts
export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendTemplatedEmail(template: string, data: any, to: string): Promise<boolean>;
}
```

---

## 📋 PRIORITY IMPLEMENTATION ORDER

### Phase 1 (Critical - User Experience):
1. ✅ Welcome email on signup
2. ✅ Account creation notification (admin-created users)
3. ✅ Interview results email
4. ✅ Password reset email (custom branded)

### Phase 2 (Important - Organization Features):
5. ✅ Organization welcome email
6. ✅ Organization member invitation
7. ✅ Student welcome email
8. ✅ Quota alert emails

### Phase 3 (Enhanced - Analytics & Engagement):
9. ✅ Weekly/monthly reports
10. ✅ Student progress reports
11. ✅ Interview started notification
12. ✅ Technical issue notifications

### Phase 4 (Optional - Advanced Features):
13. ✅ System announcements
14. ✅ Feature updates
15. ✅ Security alerts
16. ✅ Custom notification preferences

---

## 🔧 INTEGRATION CHECKLIST

- [ ] Choose email service provider
- [ ] Set up email service account and get API credentials
- [ ] Add environment variables
- [ ] Create email service wrapper (`src/lib/email/index.ts`)
- [ ] Design email templates (HTML + plain text)
- [ ] Implement branding system for org emails
- [ ] Add unsubscribe functionality (legal requirement)
- [ ] Implement email queue for bulk sends
- [ ] Add email logging/tracking
- [ ] Create admin panel for email management
- [ ] Set up email analytics (open rates, click rates)
- [ ] Test all email templates
- [ ] Configure SPF/DKIM/DMARC for domain
- [ ] Implement rate limiting
- [ ] Add user email preferences management

---

## 📊 EMAIL ANALYTICS & TRACKING

Consider tracking:
- Email delivery status
- Open rates
- Click-through rates
- Bounce rates
- Unsubscribe rates
- Conversion metrics (e.g., users who completed profile after welcome email)

---

## 🔒 COMPLIANCE & BEST PRACTICES

1. **GDPR/Privacy:**
   - Include privacy policy link
   - Provide unsubscribe option (except transactional emails)
   - Store email consent

2. **CAN-SPAM Act:**
   - Include physical address
   - Honor unsubscribe requests within 10 days
   - Accurate subject lines

3. **Security:**
   - Never include sensitive data in emails
   - Use secure links (HTTPS)
   - Implement email verification for sensitive actions

4. **Deliverability:**
   - Authenticate domain (SPF, DKIM, DMARC)
   - Monitor sender reputation
   - Use reputable email service
   - Avoid spam trigger words
   - Include plain text version

---

## 💡 TEMPLATE EXAMPLES

### Example: Welcome Email Structure
```
Subject: Welcome to [ORG_NAME] - Your Interview Preparation Journey Starts Here!

Hi [STUDENT_NAME],

Welcome to [ORG_NAME]'s visa interview preparation platform powered by Consularly!

We're excited to help you prepare for your [COUNTRY] visa interview. Here's what you can do next:

1. Complete Your Profile
   Set up your student profile to get personalized interview questions
   → [PROFILE_LINK]

2. Start Your First Practice Interview
   Choose your visa type and begin practicing right away
   → [START_INTERVIEW_LINK]

3. Track Your Progress
   View your performance analytics and improvement over time
   → [DASHBOARD_LINK]

Need help? Reply to this email or contact us at [SUPPORT_EMAIL]

Best regards,
The [ORG_NAME] Team

---
[ORG_LOGO]
[FOOTER_LINKS] | [UNSUBSCRIBE]
```

---

## 🚀 NEXT STEPS

1. Review this document with your team
2. Choose email service provider based on budget and needs
3. Prioritize which emails to implement first
4. Design email templates with your branding
5. Set up email infrastructure
6. Implement in phases as outlined above
7. Test thoroughly before production
8. Monitor email performance and iterate

---

**Last Updated:** October 30, 2025
**Version:** 1.0
