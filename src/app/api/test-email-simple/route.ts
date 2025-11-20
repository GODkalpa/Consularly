import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import nodemailer from 'nodemailer'
import type { OrganizationBranding } from '@/types/firestore'

/**
 * Simple Test Email Endpoint (No Auth Required - For Testing Only)
 * POST /api/test-email-simple
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, recipientEmail } = body

    if (!orgId || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orgId and recipientEmail' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Fetch organization branding
    const orgDoc = await adminDb().collection('organizations').doc(orgId).get()
    if (!orgDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    const orgData = orgDoc.data()
    const orgName = orgData?.name || 'Organization'
    const orgBranding: OrganizationBranding | undefined = orgData?.settings?.customBranding

    // Create SMTP transport
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.error('[Test Email] SMTP credentials not configured')
      return NextResponse.json(
        { success: false, error: 'SMTP credentials not configured' },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport(smtpConfig)

    // Resolve sender email - use org alias if available, fallback to default
    const senderEmail = orgBranding?.emailAlias || process.env.DEFAULT_SENDER_EMAIL || 'info@consularly.com'
    const senderName = orgBranding?.companyName || orgName
    const primaryColor = orgBranding?.primaryColor || '#3b82f6'

    // Generate test email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Email - ${senderName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%); padding: 30px 20px; text-align: center;">
            ${orgBranding?.logoUrl ? `<img src="${orgBranding.logoUrl}" alt="${senderName}" style="max-width: 150px; max-height: 60px; margin-bottom: 10px;">` : `<h1 style="color: #ffffff; margin: 0;">${senderName}</h1>`}
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #111827; margin-top: 0;">✅ Test Email Successful!</h2>
            <p style="font-size: 16px; color: #374151;">
              This is a test email from your Hostinger SMTP configuration.
            </p>
            <div style="background-color: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: 600;">Email Configuration:</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Sender: ${senderEmail}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Organization: ${orgName}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Email Alias: ${orgBranding?.emailAlias || 'Not configured'}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              If you received this email, your SMTP configuration is working correctly!
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0;">© ${new Date().getFullYear()} ${senderName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send test email
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject: `Test Email from ${senderName}`,
      html: htmlContent,
      replyTo: senderEmail,
    }

    console.log(`[Test Email] Sending test email to ${recipientEmail} from ${senderEmail}`)

    await transporter.sendMail(mailOptions)

    console.log(`[Test Email] Successfully sent test email to ${recipientEmail}`)

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      details: {
        senderEmail,
        senderName,
        recipientEmail,
        orgName,
        hasEmailAlias: !!orgBranding?.emailAlias,
      },
    })
  } catch (error: any) {
    console.error('[Test Email] Failed to send test email:', error)

    let errorMessage = 'Failed to send test email'
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check your credentials.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'SMTP connection failed. Check your host and port.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
