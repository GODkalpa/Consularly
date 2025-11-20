/**
 * Email Service Index
 * Central export point for email-related functionality
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Re-export types
export type { OrganizationBranding } from '@/types/firestore'

// Email service singleton
let emailTransport: Transporter | null = null

/**
 * Get email service transporter
 * Creates SMTP transport using environment variables
 */
export function getEmailService() {
  if (!emailTransport) {
    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    }

    if (!config.host || !config.auth.user || !config.auth.pass) {
      console.warn('[Email Service] SMTP credentials not configured')
      throw new Error('SMTP credentials not configured')
    }

    emailTransport = nodemailer.createTransport(config)
  }

  return {
    sendEmail: async (params: {
      to: string | string[]
      cc?: string[]
      subject: string
      html: string
      text: string
      from?: string
      replyTo?: string
    }) => {
      const from = params.from || `"${process.env.DEFAULT_SENDER_NAME || 'Consularly'}" <${process.env.DEFAULT_SENDER_EMAIL || 'info@consularly.com'}>`
      
      await emailTransport!.sendMail({
        from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo,
      })
    },
  }
}

// Re-export send helpers
export * from './send-helpers'
