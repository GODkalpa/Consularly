/**
 * Email Service - Brevo Integration
 * Central email service for sending transactional emails via Brevo (formerly Sendinblue)
 */

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: number;
  templateData?: Record<string, any>;
  attachments?: Array<{
    name: string;
    content: string; // Base64 encoded
    contentType?: string;
  }>;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface OrganizationBranding {
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
  tagline?: string;
}

export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private replyTo: string;
  private apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS || 'noreply@consularly.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Consularly';
    this.replyTo = process.env.EMAIL_REPLY_TO || 'support@consularly.com';

    if (!this.apiKey) {
      console.warn('[EmailService] BREVO_API_KEY not configured');
    }
  }

  /**
   * Send a transactional email via Brevo
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.apiKey) {
      console.error('[EmailService] Cannot send email: BREVO_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const payload: any = {
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: this.formatRecipients(options.to),
        subject: options.subject,
        replyTo: {
          email: options.replyTo || this.replyTo,
        },
      };

      // Add CC if provided
      if (options.cc) {
        payload.cc = this.formatRecipients(options.cc);
      }

      // Add BCC if provided
      if (options.bcc) {
        payload.bcc = this.formatRecipients(options.bcc);
      }

      // Use template or custom HTML/text
      if (options.templateId) {
        payload.templateId = options.templateId;
        payload.params = options.templateData || {};
      } else {
        if (options.html) {
          payload.htmlContent = options.html;
        }
        if (options.text) {
          payload.textContent = options.text;
        }
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        payload.attachment = options.attachments;
      }

      // Add custom headers if provided
      if (options.headers) {
        payload.headers = options.headers;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[EmailService] Brevo API error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send email',
        };
      }

      console.log('[EmailService] Email sent successfully:', data.messageId);
      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error: any) {
      console.error('[EmailService] Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Format recipients for Brevo API
   */
  private formatRecipients(recipients: string | string[]): Array<{ email: string; name?: string }> {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    return emails.map(email => ({ email }));
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[EmailService] Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
