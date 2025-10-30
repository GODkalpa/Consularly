/**
 * Account Creation Email Template
 * Sent when an admin creates an account for a user
 */

interface AccountCreationEmailData {
  displayName: string;
  email: string;
  resetLink: string;
  role: string;
  orgName?: string;
  createdBy: string;
  dashboardLink: string;
}

export function generateAccountCreationEmail(data: AccountCreationEmailData): { subject: string; html: string; text: string } {
  const isOrgMember = !!data.orgName;
  const subject = isOrgMember 
    ? `Your ${data.orgName} Account Has Been Created`
    : `Your Consularly Account Has Been Created`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 10px 0 0 0; font-size: 28px; }
    .logo { max-width: 180px; height: auto; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 32px; background-color: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .info-box { background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${appUrl}/Consularly.png" alt="Consularly" class="logo" />
      <h1>🎉 Account Created!</h1>
    </div>
    
    <div class="content">
      <h2>Hi ${data.displayName},</h2>
      
      ${isOrgMember ? `
        <p><strong>${data.createdBy}</strong> has created an account for you on ${data.orgName}'s visa interview preparation platform powered by Consularly.</p>
      ` : `
        <p><strong>${data.createdBy}</strong> has created an account for you on Consularly.</p>
      `}
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Your Account Details</h3>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role === 'admin' ? 'Administrator' : 'Member'}</p>
        ${isOrgMember ? `<p style="margin: 5px 0;"><strong>Organization:</strong> ${data.orgName}</p>` : ''}
      </div>
      
      <h3>🔐 Set Up Your Password</h3>
      <p>To access your account, you need to set up your password first. Click the button below to create your password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" class="button">Set Up My Password →</a>
      </div>
      
      <div class="alert-box">
        <strong>⏰ Important:</strong> This password setup link will expire in 24 hours for security reasons. If it expires, you can request a new one from the login page.
      </div>
      
      <h3>📚 What's Next?</h3>
      <ol>
        <li><strong>Set Your Password:</strong> Click the button above to create a secure password</li>
        <li><strong>Log In:</strong> Use your email (${data.email}) and new password to sign in</li>
        ${isOrgMember ? `
          <li><strong>Complete Your Profile:</strong> Fill in your student information for personalized interviews</li>
          <li><strong>Start Practicing:</strong> Begin your visa interview preparation journey</li>
        ` : `
          <li><strong>Explore the Dashboard:</strong> Familiarize yourself with the platform features</li>
        `}
      </ol>
      
      ${isOrgMember ? `
        <h3>✨ What You Can Do:</h3>
        <ul>
          <li>Practice realistic visa interview scenarios</li>
          <li>Get AI-powered feedback on your responses</li>
          <li>Track your progress and improvement</li>
          <li>Access detailed performance reports</li>
        </ul>
      ` : ''}
      
      <p><strong>Need Help?</strong><br>
      If you have any questions or didn't request this account, please reply to this email or contact support.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardLink}" style="color: #1d4ed8; text-decoration: none;">View Dashboard →</a>
      </div>
      
      <p>Best regards,<br>
      <strong>${isOrgMember ? `The ${data.orgName} Team` : 'The Consularly Team'}</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="${data.dashboardLink}" style="color: #1d4ed8;">Dashboard</a> • 
        <a href="mailto:support@consularly.com" style="color: #1d4ed8;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Account Created!

Hi ${data.displayName},

${isOrgMember 
  ? `${data.createdBy} has created an account for you on ${data.orgName}'s visa interview preparation platform powered by Consularly.`
  : `${data.createdBy} has created an account for you on Consularly.`
}

YOUR ACCOUNT DETAILS
- Email: ${data.email}
- Role: ${data.role === 'admin' ? 'Administrator' : 'Member'}
${isOrgMember ? `- Organization: ${data.orgName}` : ''}

SET UP YOUR PASSWORD
To access your account, you need to set up your password first.

Set up password: ${data.resetLink}

⏰ IMPORTANT: This link will expire in 24 hours for security reasons.

WHAT'S NEXT?
1. Set Your Password: Click the link above to create a secure password
2. Log In: Use your email (${data.email}) and new password to sign in
${isOrgMember 
  ? `3. Complete Your Profile: Fill in your student information
4. Start Practicing: Begin your visa interview preparation journey`
  : `3. Explore the Dashboard: Familiarize yourself with the platform`
}

Dashboard: ${data.dashboardLink}

Need help? Reply to this email or contact support@consularly.com

Best regards,
${isOrgMember ? `The ${data.orgName} Team` : 'The Consularly Team'}

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
