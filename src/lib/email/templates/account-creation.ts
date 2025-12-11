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
  dashboardLink: string;
}

export function generateAccountCreationEmail(data: AccountCreationEmailData): { subject: string; html: string; text: string } {
  const isOrgMember = !!data.orgName;
  const subject = isOrgMember 
    ? `Your ${data.orgName} Account Has Been Created`
    : `Your Consularly Account Has Been Created`;

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
    <div style="background-color: #4840A3; padding: 40px 20px; text-align: center;">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" style="max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">🎉 Account Created!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.displayName},</h2>
      
      ${isOrgMember ? `
        <p style="color: #475569;">An account has been created for you on <strong style="color: #4840A3;">${data.orgName}</strong>'s visa interview preparation platform powered by Consularly.</p>
      ` : `
        <p style="color: #475569;">An account has been created for you on <strong style="color: #4840A3;">Consularly</strong>.</p>
      `}
      
      <!-- Account Details Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">📋 Your Account Details</h3>
        <p style="margin: 8px 0; color: #475569;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin: 8px 0; color: #475569;"><strong>Role:</strong> ${data.role === 'admin' ? 'Administrator' : 'Member'}</p>
        ${isOrgMember ? `<p style="margin: 8px 0; color: #475569;"><strong>Organization:</strong> ${data.orgName}</p>` : ''}
      </div>
      
      <h3 style="color: #1e293b;">🔐 Set Up Your Password</h3>
      <p style="color: #475569;">To access your account, you need to set up your password first. Click the button below to create your password:</p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Set Up My Password →</a>
      </div>
      
      <!-- Alert Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">⏰ Important:</strong>
        <span style="color: #a16207;"> This password setup link will expire in 24 hours for security reasons. If it expires, you can request a new one from the login page.</span>
      </div>
      
      <h3 style="color: #1e293b;">📚 What's Next?</h3>
      <ol style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Set Your Password:</strong> Click the button above to create a secure password</li>
        <li style="margin: 8px 0;"><strong>Log In:</strong> Use your email (${data.email}) and new password to sign in</li>
        ${isOrgMember ? `
          <li style="margin: 8px 0;"><strong>Complete Your Profile:</strong> Fill in your student information for personalized interviews</li>
          <li style="margin: 8px 0;"><strong>Start Practicing:</strong> Begin your visa interview preparation journey</li>
        ` : `
          <li style="margin: 8px 0;"><strong>Explore the Dashboard:</strong> Familiarize yourself with the platform features</li>
        `}
      </ol>
      
      ${isOrgMember ? `
        <h3 style="color: #1e293b;">✨ What You Can Do:</h3>
        <ul style="color: #475569; padding-left: 20px;">
          <li style="margin: 8px 0;">Practice realistic visa interview scenarios</li>
          <li style="margin: 8px 0;">Get AI-powered feedback on your responses</li>
          <li style="margin: 8px 0;">Track your progress and improvement</li>
          <li style="margin: 8px 0;">Access detailed performance reports</li>
        </ul>
      ` : ''}
      
      <p style="color: #475569;"><strong style="color: #1e293b;">Need Help?</strong><br>
      If you have any questions or didn't request this account, please reply to this email or contact support.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">View Dashboard →</a>
      </div>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">${isOrgMember ? `The ${data.orgName} Team` : 'The Consularly Team'}</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none;">Dashboard</a> • 
        <a href="mailto:support@consularly.com" style="color: #4840A3; text-decoration: none;">Support</a>
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
  ? `An account has been created for you on ${data.orgName}'s visa interview preparation platform powered by Consularly.`
  : `An account has been created for you on Consularly.`
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
