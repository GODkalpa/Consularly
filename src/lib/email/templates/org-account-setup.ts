/**
 * Organization Account Setup Email Template
 * Sent when a new organization is created with an admin account
 * Includes password setup link, subdomain info, and getting started guide
 */

interface OrgAccountSetupEmailData {
  adminName: string;
  email: string;
  orgName: string;
  orgId: string;
  plan: string;
  quotaLimit: number;
  subdomain?: string;
  subdomainUrl?: string;
  resetLink: string;
  dashboardLink: string;
  brandingLink: string;
  studentsLink: string;
}

export function generateOrgAccountSetupEmail(data: OrgAccountSetupEmailData): { subject: string; html: string; text: string } {
  const subject = `Welcome to Consularly - Set Up Your ${data.orgName} Account`;

  const planFeatures: Record<string, string[]> = {
    'basic': ['10 interview credits', 'Logo customization', 'Primary color branding'],
    'plus': ['25 interview credits', 'All Basic features', 'Secondary colors', 'Custom tagline'],
    'premium': ['50 interview credits', 'All Plus features', 'Background images', 'Custom fonts'],
    'enterprise': ['Custom quota', 'All Premium features', 'White-label mode', 'Priority support']
  };

  const features = planFeatures[data.plan] || planFeatures['basic'];

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
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1749617997/Consularly_1_iqvpqt.png" alt="Consularly" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">🎉 Welcome to Consularly!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">Your organization account is ready</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.adminName},</h2>
      
      <p style="color: #475569;">Great news! Your organization <strong style="color: #4840A3;">${data.orgName}</strong> has been created on Consularly. You're just one step away from helping your students ace their visa interviews.</p>
      
      <!-- Password Setup Alert -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">🔐 First Step: Set Up Your Password</strong><br>
        <span style="color: #a16207;">Click the button below to create your password and activate your account.</span>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Set Up My Password →</a>
      </div>
      
      ${data.subdomain && data.subdomainUrl ? `
      <!-- Subdomain Box -->
      <div style="background: linear-gradient(135deg, #4840A3 0%, #7c3aed 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
        <div style="color: rgba(255,255,255,0.9); font-size: 14px;">🌐 Your Organization's Custom URL</div>
        <a href="${data.subdomainUrl}" style="display: inline-block; font-size: 18px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 8px; margin-top: 12px; color: #ffffff; text-decoration: none;">${data.subdomainUrl}</a>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Share this link with your students for a branded experience</p>
      </div>
      ` : ''}
      
      <!-- Account Details -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">📋 Your Account Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Organization:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.orgName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #1e293b; border-bottom: 1px solid #e2e8f0;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Plan:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><span style="background-color: #4840A3; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${data.plan.toUpperCase()}</span></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Interview Credits:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #059669; border-bottom: 1px solid #e2e8f0;">${data.quotaLimit}</td>
          </tr>
          ${data.subdomainUrl ? `
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Custom URL:</td>
            <td style="padding: 10px 0;"><a href="${data.subdomainUrl}" style="color: #4840A3; font-weight: 600; text-decoration: none;">${data.subdomainUrl}</a></td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Getting Started -->
      <h3 style="color: #1e293b; margin-top: 30px;">🚀 Getting Started (After Password Setup)</h3>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #166534;">1. Customize Your Branding</strong><br>
        <span style="color: #15803d;">Add your logo, colors, and company information to create a branded experience.</span>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">2. Add Your Students</strong><br>
        <span style="color: #1d4ed8;">Create student accounts and assign interview credits.</span>
      </div>
      
      <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #7e22ce;">3. Start Interview Simulations</strong><br>
        <span style="color: #9333ea;">Help students practice for USA, UK, or France visa interviews.</span>
      </div>
      
      <!-- Plan Features -->
      <h3 style="color: #1e293b; margin-top: 30px;">✨ Your ${data.plan.toUpperCase()} Plan Includes</h3>
      <ul style="color: #475569; padding-left: 20px;">
        ${features.map(feature => `<li style="margin: 8px 0;">${feature}</li>`).join('')}
      </ul>
      
      <!-- Important Notice -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">⏰ Important:</strong>
        <span style="color: #a16207;"> The password setup link expires in 1 hour. If it expires, you can request a new one from the login page.</span>
      </div>
      
      <!-- Pro Tip -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #166534;">💡 Pro Tip:</strong>
        <span style="color: #15803d;"> After setting up your password, bookmark your dashboard for quick access.</span>
      </div>
      
      <p style="color: #475569;"><strong style="color: #1e293b;">Need Help?</strong><br>
      Our support team is here to help you get started. Reply to this email or contact us at <a href="mailto:support@consularly.com" style="color: #4840A3;">support@consularly.com</a></p>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">The Consularly Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="mailto:support@consularly.com" style="color: #4840A3; text-decoration: none;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Consularly - ${data.orgName} Account Setup

Hi ${data.adminName},

Great news! Your organization ${data.orgName} has been created on Consularly.

🔐 FIRST STEP: SET UP YOUR PASSWORD
Click this link to create your password and activate your account:
${data.resetLink}

${data.subdomainUrl ? `
🌐 YOUR ORGANIZATION'S CUSTOM URL
${data.subdomainUrl}
Share this link with your students for a branded experience.
` : ''}

📋 YOUR ACCOUNT DETAILS
- Organization: ${data.orgName}
- Email: ${data.email}
- Plan: ${data.plan.toUpperCase()}
- Interview Credits: ${data.quotaLimit}
${data.subdomainUrl ? `- Custom URL: ${data.subdomainUrl}` : ''}

🚀 GETTING STARTED (After Password Setup)

1. Customize Your Branding
   Add your logo, colors, and company information.

2. Add Your Students
   Create student accounts and assign interview credits.

3. Start Interview Simulations
   Help students practice for USA, UK, or France visa interviews.

✨ YOUR ${data.plan.toUpperCase()} PLAN INCLUDES
${features.map(f => `- ${f}`).join('\n')}

⏰ IMPORTANT: The password setup link expires in 1 hour.

Dashboard: ${data.dashboardLink}

Need help? Reply to this email or contact support@consularly.com

Best regards,
The Consularly Team

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
