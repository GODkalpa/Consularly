/**
 * Email Send Helpers
 * Convenient functions to send various types of emails throughout the application
 */

import { getEmailService } from './index';
import { generateWelcomeEmail } from './templates/welcome';
import { generateAccountCreationEmail } from './templates/account-creation';
import { generateOrgWelcomeEmail } from './templates/org-welcome';
import { generateInterviewResultsEmail } from './templates/interview-results';
import { generateQuotaAlertEmail } from './templates/quota-alert';
import { generatePasswordResetEmail } from './templates/password-reset';
import type { OrganizationBranding } from './index';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send welcome email to new signup users
 */
export async function sendWelcomeEmail(params: {
  to: string;
  displayName: string;
  userId: string;
}) {
  const emailService = getEmailService();
  
  const { subject, html, text } = generateWelcomeEmail({
    displayName: params.displayName,
    email: params.to,
    profileSetupLink: `${BASE_URL}/profile-setup`,
    dashboardLink: `${BASE_URL}/dashboard`,
  });

  return await emailService.sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * Send account creation notification when admin creates a user
 */
export async function sendAccountCreationEmail(params: {
  to: string;
  displayName: string;
  resetLink: string;
  role: string;
  orgName?: string;
}) {
  const emailService = getEmailService();
  
  const dashboardLink = params.orgName ? `${BASE_URL}/org` : `${BASE_URL}/dashboard`;
  
  const { subject, html, text } = generateAccountCreationEmail({
    displayName: params.displayName,
    email: params.to,
    resetLink: params.resetLink,
    role: params.role,
    orgName: params.orgName,
    dashboardLink,
  });

  return await emailService.sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * Send password reset email with custom branding
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  displayName?: string;
  resetLink: string;
  orgName?: string;
  orgBranding?: OrganizationBranding;
}) {
  const emailService = getEmailService();
  
  const { subject, html, text } = generatePasswordResetEmail({
    displayName: params.displayName,
    email: params.to,
    resetLink: params.resetLink,
    orgName: params.orgName,
    orgBranding: params.orgBranding,
  });

  return await emailService.sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * Send organization welcome email when new org is created
 */
export async function sendOrgWelcomeEmail(params: {
  to: string;
  adminName: string;
  orgName: string;
  orgId: string;
  plan: 'basic' | 'premium' | 'enterprise';
  quotaLimit: number;
}) {
  const emailService = getEmailService();
  
  const { subject, html, text } = generateOrgWelcomeEmail({
    adminName: params.adminName,
    orgName: params.orgName,
    orgId: params.orgId,
    plan: params.plan,
    quotaLimit: params.quotaLimit,
    dashboardLink: `${BASE_URL}/org`,
    brandingLink: `${BASE_URL}/org?tab=branding`,
    studentsLink: `${BASE_URL}/org?tab=students`,
  });

  return await emailService.sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * Send interview results email after completion
 */
export async function sendInterviewResultsEmail(params: {
  to: string;
  cc?: string[];
  studentName: string;
  interviewType: string;
  overall: number;
  decision: 'accepted' | 'rejected' | 'borderline';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reportLink: string;
  orgName?: string;
  orgBranding?: OrganizationBranding;
  interviewDate?: string;
}) {
  const emailService = getEmailService();
  
  const { subject, html, text } = generateInterviewResultsEmail({
    studentName: params.studentName,
    interviewType: params.interviewType,
    overall: params.overall,
    decision: params.decision,
    summary: params.summary,
    strengths: params.strengths,
    weaknesses: params.weaknesses,
    reportLink: params.reportLink,
    orgName: params.orgName,
    orgBranding: params.orgBranding,
    interviewDate: params.interviewDate || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
  });

  return await emailService.sendEmail({
    to: params.to,
    cc: params.cc,
    subject,
    html,
    text,
  });
}

/**
 * Send quota alert email when thresholds are reached
 */
export async function sendQuotaAlertEmail(params: {
  to: string | string[];
  orgName: string;
  adminName: string;
  threshold: '75%' | '90%' | '100%';
  quotaUsed: number;
  quotaLimit: number;
  orgId: string;
}) {
  const emailService = getEmailService();
  
  const { subject, html, text } = generateQuotaAlertEmail({
    orgName: params.orgName,
    adminName: params.adminName,
    threshold: params.threshold,
    quotaUsed: params.quotaUsed,
    quotaLimit: params.quotaLimit,
    dashboardLink: `${BASE_URL}/org`,
    upgradeLink: `${BASE_URL}/org?tab=settings&action=upgrade`,
  });

  return await emailService.sendEmail({
    to: params.to,
    subject,
    html,
    text,
  });
}

/**
 * Send generic notification email
 */
export async function sendNotificationEmail(params: {
  to: string | string[];
  subject: string;
  message: string;
  actionText?: string;
  actionLink?: string;
}) {
  const emailService = getEmailService();
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>${params.message.replace(/\n/g, '<br>')}</p>
    ${params.actionText && params.actionLink ? `
      <div style="text-align: center;">
        <a href="${params.actionLink}" class="button">${params.actionText}</a>
      </div>
    ` : ''}
    <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
      Best regards,<br>
      The Consularly Team
    </p>
  </div>
</body>
</html>
  `;

  const text = `
${params.message}

${params.actionText && params.actionLink ? `${params.actionText}: ${params.actionLink}` : ''}

Best regards,
The Consularly Team
  `;

  return await emailService.sendEmail({
    to: params.to,
    subject: params.subject,
    html,
    text,
  });
}

/**
 * Check quota and send alerts if thresholds reached
 * Returns true if alert was sent
 */
export async function checkAndSendQuotaAlert(params: {
  orgId: string;
  orgName: string;
  adminEmails: string[];
  adminName: string;
  quotaUsed: number;
  quotaLimit: number;
  lastAlertSent?: { threshold: string; timestamp: number };
}): Promise<boolean> {
  const percentage = (params.quotaUsed / params.quotaLimit) * 100;
  
  // Determine threshold
  let threshold: '75%' | '90%' | '100%' | null = null;
  if (percentage >= 100) threshold = '100%';
  else if (percentage >= 90) threshold = '90%';
  else if (percentage >= 75) threshold = '75%';
  
  if (!threshold) return false;
  
  // Check if we already sent this alert recently (within 24 hours)
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (
    params.lastAlertSent?.threshold === threshold &&
    now - params.lastAlertSent.timestamp < twentyFourHours
  ) {
    return false; // Don't spam alerts
  }
  
  // Send alert
  await sendQuotaAlertEmail({
    to: params.adminEmails,
    orgName: params.orgName,
    adminName: params.adminName,
    threshold,
    quotaUsed: params.quotaUsed,
    quotaLimit: params.quotaLimit,
    orgId: params.orgId,
  });
  
  return true;
}
