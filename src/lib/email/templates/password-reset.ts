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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: ${brandColor}; padding: 40px 20px; text-align: center;">
      <img src="${logoUrl}" alt="${brandName}" style="max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">Password Reset</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${displayName},</h2>
      
      <p style="color: #475569;">We received a request to reset your password${isOrgUser ? ` for your ${brandName} account` : ''}. If you made this request, click the button below to set a new password.</p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="display: inline-block; padding: 16px 40px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
      </div>
      
      <!-- Alert Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">⏰ Important:</strong>
        <span style="color: #a16207;"> This password reset link will expire in 1 hour for security reasons. If it expires, you can request a new one from the login page.</span>
      </div>
      
      <p style="color: #475569;">If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <div style="background-color: #f8fafc; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #64748b; margin: 15px 0; border: 1px solid #e2e8f0;">
        ${data.resetLink}
      </div>
      
      <!-- Info Box -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;"><strong>Didn't request a password reset?</strong></p>
        <p style="margin: 10px 0 0 0; color: #1d4ed8;">You can safely ignore this email. Your password will not be changed unless you click the link above.</p>
      </div>
      
      <p style="color: #475569;"><strong style="color: #1e293b;">Security reminder:</strong> Never share your password with anyone. ${brandName} will never ask for your password via email.</p>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">${isOrgUser ? `The ${brandName} Team` : 'The Consularly Team'}</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="mailto:support@consularly.com" style="color: ${brandColor}; text-decoration: none;">Support</a>
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
