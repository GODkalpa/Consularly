/**
 * Password Reset Email Template
 * Sent when user requests a password reset
 */

interface PasswordResetEmailData {
  displayName?: string;
  email: string;
  resetLink: string;
  orgName?: string;
  orgBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): { subject: string; html: string; text: string } {
  const brandColor = data.orgBranding?.primaryColor || '#4840A3';
  const brandName = data.orgBranding?.companyName || data.orgName || 'Consularly';
  const logoUrl = data.orgBranding?.logoUrl || 'https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png';
  const displayName = data.displayName || 'there';
  const isOrgUser = !!data.orgName;

  const subject = `Reset Your Password`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: ${brandColor}; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 10px 0 0 0; font-size: 28px; }
    .logo { max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 32px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .info-box { background-color: #D8EFF7; border: 2px solid #9CBBFC; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .alert-box { background-color: #FFF8E1; border-left: 4px solid #F9CD6A; padding: 15px 20px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brandName}" class="logo" />
      <h1>Password Reset</h1>
    </div>
    
    <div class="content">
      <h2>Hi ${displayName},</h2>
      
      <p>We received a request to reset your password${isOrgUser ? ` for your ${brandName} account` : ''}. If you made this request, click the button below to set a new password.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" class="button">Reset Password</a>
      </div>
      
      <div class="alert-box">
        <strong>⏰ Important:</strong> This password reset link will expire in 1 hour for security reasons. If it expires, you can request a new one from the login page.
      </div>
      
      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #64748b; margin: 15px 0;">
        ${data.resetLink}
      </div>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>Didn't request a password reset?</strong></p>
        <p style="margin: 10px 0 0 0;">You can safely ignore this email. Your password will not be changed unless you click the link above.</p>
      </div>
      
      <p><strong>Security reminder:</strong> Never share your password with anyone. ${brandName} will never ask for your password via email.</p>
      
      <p>Best regards,<br>
      <strong>${isOrgUser ? `The ${brandName} Team` : 'The Consularly Team'}</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="mailto:support@consularly.com" style="color: ${brandColor};">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Password Reset

Hi ${displayName},

We received a request to reset your password${isOrgUser ? ` for your ${brandName} account` : ''}. If you made this request, click the link below to set a new password.

Reset password: ${data.resetLink}

⏰ IMPORTANT: This link will expire in 1 hour for security reasons. If it expires, you can request a new one from the login page.

DIDN'T REQUEST THIS?
You can safely ignore this email. Your password will not be changed unless you click the link above.

Security reminder: Never share your password with anyone. ${brandName} will never ask for your password via email.

Best regards,
${isOrgUser ? `The ${brandName} Team` : 'The Consularly Team'}

© ${new Date().getFullYear()} Consularly. All rights reserved.
Support: support@consularly.com
  `;

  return { subject, html, text };
}
