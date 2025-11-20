/**
 * White-labeled Email Service for Organization Scheduling
 * All emails sent with organization branding (logo, name, colors)
 * Uses Hostinger SMTP via Nodemailer
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { OrganizationBranding } from '@/types/firestore'

// SMTP Transport Configuration
let smtpTransport: Transporter | null = null

/**
 * Create and configure SMTP transport
 */
function createSMTPTransport(): Transporter | null {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // Use TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  }

  if (!config.host || !config.auth.user || !config.auth.pass) {
    console.warn('[Email] SMTP credentials not configured')
    return null
  }

  try {
    return nodemailer.createTransport(config)
  } catch (error) {
    console.error('[Email] Failed to create SMTP transport:', error)
    return null
  }
}

/**
 * Get or create SMTP transport (singleton pattern)
 */
function getSMTPTransport(): Transporter | null {
  if (!smtpTransport) {
    smtpTransport = createSMTPTransport()
  }
  return smtpTransport
}

/**
 * Resolve sender email from organization branding
 * Falls back to default if no alias configured
 */
function resolveSenderEmail(orgBranding?: OrganizationBranding): string {
  if (orgBranding?.emailAlias) {
    return orgBranding.emailAlias
  }
  return process.env.DEFAULT_SENDER_EMAIL || 'info@consularly.com'
}

interface EmailBaseParams {
  to: string
  studentName: string
  orgName: string
  orgBranding?: OrganizationBranding
}

interface InterviewConfirmationParams extends EmailBaseParams {
  interviewDate: string
  interviewTime: string
  timezone: string
  route: string
  routeDisplay: string
  slotId: string
  rescheduleLink?: string
  cancelLink?: string
  joinLink?: string
}

interface ReminderParams extends EmailBaseParams {
  interviewDate: string
  interviewTime: string
  timezone: string
  route: string
  routeDisplay: string
  hoursUntil: number
  joinLink?: string
  rescheduleLink?: string
}

interface CancellationParams extends EmailBaseParams {
  interviewDate: string
  interviewTime: string
  reason?: string
  rebookLink?: string
}

interface RescheduleConfirmationParams extends EmailBaseParams {
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  timezone: string
  route: string
  routeDisplay: string
}

interface StudentInvitationParams extends EmailBaseParams {
  initialCredits: number
  invitationUrl: string
  expiryDays: number
}

/**
 * Generate white-labeled HTML email template
 */
function generateEmailTemplate(
  content: string,
  orgName: string,
  orgBranding?: OrganizationBranding
): string {
  const logoUrl = orgBranding?.logoUrl
  const primaryColor = orgBranding?.primaryColor || '#3b82f6'
  const companyName = orgBranding?.companyName || orgName
  const footerText = orgBranding?.footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`
  const website = orgBranding?.socialLinks?.website

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Notification - ${companyName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          max-width: 150px;
          max-height: 60px;
          margin-bottom: 10px;
        }
        .header-title {
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0 0 0;
        }
        .content {
          padding: 40px 30px;
        }
        .button {
          display: inline-block;
          padding: 14px 28px;
          background-color: ${primaryColor};
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
          transition: opacity 0.2s;
        }
        .button:hover {
          opacity: 0.9;
        }
        .button-secondary {
          background-color: #6b7280;
          margin-left: 10px;
        }
        .info-box {
          background-color: #f9fafb;
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          min-width: 120px;
          color: #6b7280;
        }
        .info-value {
          color: #111827;
        }
        .footer {
          background-color: #f9fafb;
          padding: 25px 30px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer a {
          color: ${primaryColor};
          text-decoration: none;
        }
        .alert {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          color: #92400e;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          .button {
            display: block;
            margin: 10px 0;
          }
          .button-secondary {
            margin-left: 0;
          }
        }
      </style>
    </head>
    <body>
      <div style="padding: 20px;">
        <div class="container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo">` : `<h1 style="color: #ffffff; margin: 0;">${companyName}</h1>`}
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">${footerText}</p>
            ${website ? `<p style="margin: 0;"><a href="${website}" target="_blank">${website}</a></p>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send interview confirmation email
 */
export async function sendInterviewConfirmation(params: InterviewConfirmationParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    interviewDate,
    interviewTime,
    timezone,
    route,
    routeDisplay,
    rescheduleLink,
    cancelLink,
    joinLink
  } = params

  const content = `
    <h2 style="color: #111827; margin-top: 0;">Hello ${studentName},</h2>
    <p style="font-size: 16px; color: #374151;">
      Your <strong>${routeDisplay}</strong> visa interview has been successfully scheduled!
    </p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">📅 Date:</span>
        <span class="info-value">${interviewDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🕐 Time:</span>
        <span class="info-value">${interviewTime} ${timezone}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🎯 Interview Type:</span>
        <span class="info-value">${routeDisplay}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #374151;">
      <strong>What to expect:</strong><br>
      This is a mock visa interview designed to help you prepare for your actual interview.
      The session will last approximately 30 minutes and will simulate real interview conditions.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      ${joinLink ? `<a href="${joinLink}" class="button">Join Interview</a>` : ''}
      ${rescheduleLink ? `<a href="${rescheduleLink}" class="button button-secondary">Reschedule</a>` : ''}
    </div>

    <div class="alert">
      <strong>⏰ Important:</strong> Please join 5 minutes early to test your camera and microphone.
      You'll need a stable internet connection and a quiet environment.
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you need to cancel or reschedule, please do so at least 24 hours in advance.
    </p>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Interview Confirmed - ${routeDisplay} on ${interviewDate}`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] Confirmation sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send confirmation:', error)
    }
    // Don't throw - log and continue
  }
}

/**
 * Send 24-hour reminder email
 */
export async function send24HourReminder(params: ReminderParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    interviewDate,
    interviewTime,
    timezone,
    routeDisplay,
    joinLink,
    rescheduleLink
  } = params

  const content = `
    <h2 style="color: #111827; margin-top: 0;">Reminder: Interview Tomorrow</h2>
    <p style="font-size: 16px; color: #374151;">
      Hi ${studentName},
    </p>
    <p style="font-size: 16px; color: #374151;">
      This is a friendly reminder that your <strong>${routeDisplay}</strong> interview is scheduled for tomorrow.
    </p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">📅 Date:</span>
        <span class="info-value">${interviewDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🕐 Time:</span>
        <span class="info-value">${interviewTime} ${timezone}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #374151;">
      <strong>Preparation checklist:</strong>
    </p>
    <ul style="font-size: 16px; color: #374151; padding-left: 20px;">
      <li>Test your camera and microphone</li>
      <li>Choose a quiet, well-lit location</li>
      <li>Have your documents ready (if applicable)</li>
      <li>Review common interview questions</li>
      <li>Dress professionally</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      ${joinLink ? `<a href="${joinLink}" class="button">View Interview Details</a>` : ''}
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Need to reschedule? ${rescheduleLink ? `<a href="${rescheduleLink}" style="color: #3b82f6;">Click here</a>` : 'Contact us as soon as possible.'}
    </p>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Reminder: Interview Tomorrow - ${routeDisplay}`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] 24h reminder sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send 24h reminder:', error)
    }
  }
}

/**
 * Send 1-hour reminder email
 */
export async function send1HourReminder(params: ReminderParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    interviewTime,
    timezone,
    routeDisplay,
    joinLink
  } = params

  const content = `
    <h2 style="color: #111827; margin-top: 0;">Your Interview Starts in 1 Hour!</h2>
    <p style="font-size: 16px; color: #374151;">
      Hi ${studentName},
    </p>
    <p style="font-size: 18px; color: #111827; font-weight: 600;">
      Your ${routeDisplay} interview starts at ${interviewTime} ${timezone}
    </p>

    <div class="alert">
      <strong>⚠️ Join now to test your setup!</strong><br>
      We recommend joining 5 minutes early to ensure your camera and microphone are working properly.
    </div>

    <div style="text-align: center; margin: 30px 0;">
      ${joinLink ? `<a href="${joinLink}" class="button">Join Interview Now</a>` : ''}
    </div>

    <p style="font-size: 16px; color: #374151;">
      <strong>Quick reminders:</strong>
    </p>
    <ul style="font-size: 16px; color: #374151; padding-left: 20px;">
      <li>✅ Camera and microphone working</li>
      <li>✅ Quiet, well-lit environment</li>
      <li>✅ Professional appearance</li>
      <li>✅ Documents within reach</li>
    </ul>

    <p style="font-size: 16px; color: #374151; margin-top: 30px;">
      Good luck! Take a deep breath and be confident. 💪
    </p>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Starting Soon: Interview in 1 Hour - ${routeDisplay}`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] 1h reminder sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send 1h reminder:', error)
    }
  }
}

/**
 * Send cancellation email
 */
export async function sendCancellationEmail(params: CancellationParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    interviewDate,
    interviewTime,
    reason,
    rebookLink
  } = params

  const content = `
    <h2 style="color: #111827; margin-top: 0;">Interview Cancelled</h2>
    <p style="font-size: 16px; color: #374151;">
      Hi ${studentName},
    </p>
    <p style="font-size: 16px; color: #374151;">
      We're writing to inform you that your interview scheduled for <strong>${interviewDate} at ${interviewTime}</strong> has been cancelled.
    </p>

    ${reason ? `
      <div class="info-box">
        <strong>Reason:</strong><br>
        ${reason}
      </div>
    ` : ''}

    ${rebookLink ? `
      <p style="font-size: 16px; color: #374151;">
        We apologize for any inconvenience. You can book a new slot using the link below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${rebookLink}" class="button">Book New Interview</a>
      </div>
    ` : `
      <p style="font-size: 16px; color: #374151;">
        If you'd like to reschedule, please contact us to arrange a new time.
      </p>
    `}

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you have any questions, please don't hesitate to reach out to us.
    </p>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Interview Cancelled - ${interviewDate}`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] Cancellation sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send cancellation:', error)
    }
  }
}

/**
 * Send reschedule confirmation email
 */
export async function sendRescheduleConfirmation(params: RescheduleConfirmationParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    oldDate,
    oldTime,
    newDate,
    newTime,
    timezone,
    routeDisplay
  } = params

  const content = `
    <h2 style="color: #111827; margin-top: 0;">Interview Rescheduled</h2>
    <p style="font-size: 16px; color: #374151;">
      Hi ${studentName},
    </p>
    <p style="font-size: 16px; color: #374151;">
      Your <strong>${routeDisplay}</strong> interview has been successfully rescheduled.
    </p>
    
    <div class="info-box">
      <h3 style="margin-top: 0; color: #6b7280; font-size: 14px;">Previous Time:</h3>
      <p style="margin: 5px 0; text-decoration: line-through; color: #9ca3af;">
        ${oldDate} at ${oldTime} ${timezone}
      </p>
      
      <h3 style="margin-top: 15px; color: #111827; font-size: 14px;">New Time:</h3>
      <p style="margin: 5px 0; font-weight: 600; font-size: 18px; color: #111827;">
        ${newDate} at ${newTime} ${timezone}
      </p>
    </div>

    <p style="font-size: 16px; color: #374151; margin-top: 25px;">
      We look forward to seeing you at the new time!
    </p>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      You'll receive reminder emails 24 hours and 1 hour before your interview.
    </p>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Interview Rescheduled - New Time: ${newDate}`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] Reschedule confirmation sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send reschedule confirmation:', error)
    }
  }
}

/**
 * Send student invitation email for account setup
 */
export async function sendStudentInvitation(params: StudentInvitationParams): Promise<void> {
  const transport = getSMTPTransport()
  if (!transport) {
    console.warn('[Email] SMTP not configured, skipping email')
    return
  }

  const {
    to,
    studentName,
    orgName,
    orgBranding,
    initialCredits,
    invitationUrl,
    expiryDays
  } = params

  const content = `
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="display: inline-block; background: linear-gradient(135deg, ${orgBranding?.primaryColor || '#3B82F6'} 0%, ${orgBranding?.secondaryColor || '#1E40AF'} 100%); padding: 20px; border-radius: 16px; color: white; margin-bottom: 20px;">
        <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome Aboard!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">You're just one step away from mastering your visa interview</p>
      </div>
    </div>

    <div style="background: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid ${orgBranding?.primaryColor || '#3B82F6'};">
      <p style="font-size: 18px; color: #1E293B; margin: 0 0 12px 0; font-weight: 600;">
        Hi ${studentName},
      </p>
      <p style="font-size: 16px; color: #475569; margin: 0; line-height: 1.6;">
        ${orgName} has created your personal account to practice visa interviews using our advanced AI platform. Get ready to ace your real interview!
      </p>
    </div>
    
    <div style="background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      <h3 style="color: #1E293B; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Account Details</h3>
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
          <span style="color: #64748B; font-weight: 500;">📧 Email:</span>
          <span style="color: #1E293B; font-weight: 600;">${to}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
          <span style="color: #64748B; font-weight: 500;">💳 Interview Credits:</span>
          <span style="color: #059669; font-weight: 700; background: #DCFCE7; padding: 4px 12px; border-radius: 20px;">${initialCredits} sessions</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
          <span style="color: #64748B; font-weight: 500;">⏰ Setup Deadline:</span>
          <span style="color: #DC2626; font-weight: 600;">${expiryDays} days remaining</span>
        </div>
      </div>
    </div>

    <div style="background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
      <h3 style="color: #1E293B; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">What's included in your account:</h3>
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #475569; font-size: 15px;">AI-powered interview simulations</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #475569; font-size: 15px;">Detailed performance analytics and feedback</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #475569; font-size: 15px;">Progress tracking and improvement insights</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 8px; height: 8px; background: #10B981; border-radius: 50%; flex-shrink: 0;"></div>
          <span style="color: #475569; font-size: 15px;">Downloadable interview reports</span>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, ${orgBranding?.primaryColor || '#3B82F6'} 0%, ${orgBranding?.secondaryColor || '#1E40AF'} 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3); transition: all 0.2s;">
        🚀 Set Up My Account Now
      </a>
    </div>

    <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="color: #D97706; font-size: 18px;">⚠️</div>
        <div>
          <strong style="color: #92400E;">Action Required</strong>
          <p style="color: #92400E; margin: 4px 0 0 0; font-size: 14px;">This invitation expires in ${expiryDays} days. Click the button above to secure your account access.</p>
        </div>
      </div>
    </div>

    <div style="background: #F8FAFC; border-radius: 8px; padding: 20px; text-align: center; margin-top: 32px;">
      <p style="color: #64748B; margin: 0; font-size: 14px;">
        Questions? Contact <strong>${orgName}</strong> support - we're here to help you succeed! 🎓
      </p>
    </div>
  `

  const htmlContent = generateEmailTemplate(content, orgName, orgBranding)
  const senderEmail = resolveSenderEmail(orgBranding)
  const senderName = orgBranding?.companyName || orgName

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: `"${studentName}" <${to}>`,
    subject: `Welcome to ${orgName} - Set Up Your Interview Practice Account`,
    html: htmlContent,
    replyTo: process.env.ORG_SUPPORT_EMAIL || 'support@consularly.com',
  }

  try {
    await transport.sendMail(mailOptions)
    console.log(`[Email] Student invitation sent to ${to} via ${senderEmail}`)
  } catch (error: any) {
    if (error.code === 'EAUTH') {
      console.error('[Email] SMTP authentication failed')
    } else if (error.code === 'ECONNECTION') {
      console.error('[Email] SMTP connection failed')
    } else {
      console.error('[Email] Failed to send student invitation:', error)
    }
  }
}
