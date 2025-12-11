/**
 * Email Send Helpers
 * Convenient functions to send various types of emails throughout the application
 * All functions use nodemailer directly for reliability
 * 
 * @version 2.0.0 - Migrated to direct nodemailer usage (Dec 2024)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { generateWelcomeEmail } from './templates/welcome';
import { generateAccountCreationEmail } from './templates/account-creation';
import { generateOrgWelcomeEmail } from './templates/org-welcome';
import { generateOrgAccountSetupEmail } from './templates/org-account-setup';
import { generateInterviewResultsEmail } from './templates/interview-results';
import { generateQuotaAlertEmail } from './templates/quota-alert';
import { generatePasswordResetEmail } from './templates/password-reset';
import type { OrganizationBranding } from '@/types/firestore';

export type { OrganizationBranding };

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
  return `https://${baseDomain}`;
};

const BASE_URL = getBaseUrl();

let emailTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!emailTransporter) {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    if (!config.host || !config.auth.user || !config.auth.pass) {
      console.error('[Email] SMTP not configured:', {
        host: !!config.host,
        user: !!config.auth.user,
        pass: !!config.auth.pass,
      });
      throw new Error('SMTP credentials not configured');
    }

    emailTransporter = nodemailer.createTransport(config);
  }
  return emailTransporter;
}


async function sendEmail(params: {
  to: string | string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}) {
  const transporter = getTransporter();
  const defaultFrom = `"${process.env.DEFAULT_SENDER_NAME || 'Consularly'}" <${process.env.DEFAULT_SENDER_EMAIL || 'info@consularly.com'}>`;

  await transporter.sendMail({
    from: params.from || defaultFrom,
    to: params.to,
    cc: params.cc,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo || process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  displayName: string;
  userId: string;
}) {
  const { subject, html, text } = generateWelcomeEmail({
    displayName: params.displayName,
    email: params.to,
    profileSetupLink: `${BASE_URL}/profile-setup`,
    dashboardLink: `${BASE_URL}/dashboard`,
  });

  console.log(`[sendWelcomeEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendWelcomeEmail] Successfully sent to ${params.to}`);
}

export async function sendAccountCreationEmail(params: {
  to: string;
  displayName: string;
  resetLink: string;
  role: string;
  orgName?: string;
}) {
  const dashboardLink = params.orgName ? `${BASE_URL}/org` : `${BASE_URL}/dashboard`;

  const { subject, html, text } = generateAccountCreationEmail({
    displayName: params.displayName,
    email: params.to,
    resetLink: params.resetLink,
    role: params.role,
    orgName: params.orgName,
    dashboardLink,
  });

  console.log(`[sendAccountCreationEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendAccountCreationEmail] Successfully sent to ${params.to}`);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  displayName?: string;
  resetLink: string;
  orgName?: string;
  orgBranding?: OrganizationBranding;
}) {
  const { subject, html, text } = generatePasswordResetEmail({
    displayName: params.displayName,
    email: params.to,
    resetLink: params.resetLink,
    orgName: params.orgName,
    orgBranding: params.orgBranding,
  });

  console.log(`[sendPasswordResetEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendPasswordResetEmail] Successfully sent to ${params.to}`);
}

export async function sendOrgWelcomeEmail(params: {
  to: string;
  adminName: string;
  orgName: string;
  orgId: string;
  plan: 'basic' | 'premium' | 'enterprise';
  quotaLimit: number;
}) {
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

  console.log(`[sendOrgWelcomeEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendOrgWelcomeEmail] Successfully sent to ${params.to}`);
}


export async function sendOrgAccountSetupEmail(params: {
  to: string;
  adminName: string;
  orgName: string;
  orgId: string;
  plan: string;
  quotaLimit: number;
  subdomain?: string;
  resetLink: string;
}) {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
  const subdomainUrl = params.subdomain ? `https://${params.subdomain}.${baseDomain}` : undefined;
  const dashboardBase = subdomainUrl || BASE_URL;

  const { subject, html, text } = generateOrgAccountSetupEmail({
    adminName: params.adminName,
    email: params.to,
    orgName: params.orgName,
    orgId: params.orgId,
    plan: params.plan,
    quotaLimit: params.quotaLimit,
    subdomain: params.subdomain,
    subdomainUrl,
    resetLink: params.resetLink,
    dashboardLink: `${dashboardBase}/org`,
    brandingLink: `${dashboardBase}/org?tab=branding`,
    studentsLink: `${dashboardBase}/org?tab=students`,
  });

  console.log(`[sendOrgAccountSetupEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendOrgAccountSetupEmail] Successfully sent to ${params.to}`);
}

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

  let fromAddress: string | undefined = undefined;
  if (params.orgBranding?.emailAlias) {
    const senderName = params.orgBranding.companyName || params.orgName || 'Consularly';
    fromAddress = `"${senderName}" <${params.orgBranding.emailAlias}>`;
    console.log(`[sendInterviewResultsEmail] Using org alias: ${fromAddress}`);
  }

  console.log(`[sendInterviewResultsEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, cc: params.cc, subject, html, text, from: fromAddress });
  console.log(`[sendInterviewResultsEmail] Successfully sent to ${params.to}`);
}

export async function sendQuotaAlertEmail(params: {
  to: string | string[];
  orgName: string;
  adminName: string;
  threshold: '75%' | '90%' | '100%';
  quotaUsed: number;
  quotaLimit: number;
  orgId: string;
}) {
  const { subject, html, text } = generateQuotaAlertEmail({
    orgName: params.orgName,
    adminName: params.adminName,
    threshold: params.threshold,
    quotaUsed: params.quotaUsed,
    quotaLimit: params.quotaLimit,
    dashboardLink: `${BASE_URL}/org`,
    upgradeLink: `${BASE_URL}/org?tab=settings&action=upgrade`,
  });

  console.log(`[sendQuotaAlertEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject, html, text });
  console.log(`[sendQuotaAlertEmail] Successfully sent to ${params.to}`);
}


export async function sendNotificationEmail(params: {
  to: string | string[];
  subject: string;
  message: string;
  actionText?: string;
  actionLink?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <p style="color: #475569;">${params.message.replace(/\n/g, '<br>')}</p>
    ${params.actionText && params.actionLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.actionLink}" style="display: inline-block; padding: 14px 28px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">${params.actionText}</a>
      </div>
    ` : ''}
    <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
      Best regards,<br>
      <strong style="color: #1e293b;">The Consularly Team</strong>
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

  console.log(`[sendNotificationEmail] Sending to ${params.to}`);
  await sendEmail({ to: params.to, subject: params.subject, html, text });
  console.log(`[sendNotificationEmail] Successfully sent to ${params.to}`);
}

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

  let threshold: '75%' | '90%' | '100%' | null = null;
  if (percentage >= 100) threshold = '100%';
  else if (percentage >= 90) threshold = '90%';
  else if (percentage >= 75) threshold = '75%';

  if (!threshold) return false;

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (
    params.lastAlertSent?.threshold === threshold &&
    now - params.lastAlertSent.timestamp < twentyFourHours
  ) {
    return false;
  }

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
