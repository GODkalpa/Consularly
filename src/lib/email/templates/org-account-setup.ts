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
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #4840A3; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 10px 0 0 0; font-size: 28px; }
    .logo { max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; padding: 14px 32px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .button-secondary { background-color: #F9CD6A; color: #000; }
    .feature-box { background-color: #D8EFF7; border-left: 4px solid #9CBBFC; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0; }
    .info-box { background-color: #f0f9ff; border: 2px solid #9CBBFC; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .alert-box { background-color: #FFF8E1; border-left: 4px solid #F9CD6A; padding: 15px 20px; margin: 20px 0; }
    .subdomain-box { background: linear-gradient(135deg, #4840A3 0%, #6366f1 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: white; text-align: center; }
    .subdomain-url { font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.2); padding: 12px 20px; border-radius: 8px; margin-top: 10px; display: inline-block; }
    .stat-box { background-color: #D8EFF7; border-radius: 8px; padding: 20px; text-align: center; margin: 10px; display: inline-block; min-width: 120px; }
    .stat-number { font-size: 28px; font-weight: bold; color: #4840A3; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" class="logo" />
      <h1>🎉 Welcome to Consularly!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">Your organization account is ready</p>
    </div>
    
    <div class="content">
      <h2>Hi ${data.adminName},</h2>
      
      <p>Great news! Your organization <strong>${data.orgName}</strong> has been created on Consularly. You're just one step away from helping your students ace their visa interviews.</p>
      
      <div class="alert-box">
        <strong>🔐 First Step: Set Up Your Password</strong><br>
        Click the button below to create your password and activate your account.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" class="button">Set Up My Password →</a>
      </div>
      
      ${data.subdomain && data.subdomainUrl ? `
      <div class="subdomain-box">
        <div style="font-size: 14px; opacity: 0.9;">🌐 Your Organization's Custom URL</div>
        <div class="subdomain-url">${data.subdomainUrl}</div>
        <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">Share this link with your students for a branded experience</p>
      </div>
      ` : ''}
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Your Account Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Organization:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.orgName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Email:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Plan:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.plan.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Interview Credits:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.quotaLimit}</td>
          </tr>
          ${data.subdomain ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Subdomain:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.subdomain}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <h3>🚀 Getting Started (After Password Setup)</h3>
      
      <div class="feature-box">
        <strong>1. Customize Your Branding</strong><br>
        Add your logo, colors, and company information to create a branded experience.
      </div>
      
      <div class="feature-box">
        <strong>2. Add Your Students</strong><br>
        Create student accounts and assign interview credits.
      </div>
      
      <div class="feature-box">
        <strong>3. Start Interview Simulations</strong><br>
        Help students practice for USA, UK, or France visa interviews.
      </div>
      
      <h3>✨ Your ${data.plan.toUpperCase()} Plan Includes</h3>
      <ul>
        ${features.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
      
      <div class="alert-box">
        <strong>⏰ Important:</strong> The password setup link expires in 1 hour. If it expires, you can request a new one from the login page.
      </div>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0;">
        <strong>💡 Pro Tip:</strong> After setting up your password, bookmark your dashboard for quick access: ${data.dashboardLink}
      </div>
      
      <p><strong>Need Help?</strong><br>
      Our support team is here to help you get started. Reply to this email or contact us at support@consularly.com</p>
      
      <p>Best regards,<br>
      <strong>The Consularly Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="mailto:support@consularly.com" style="color: #4840A3;">Support</a>
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

${data.subdomain && data.subdomainUrl ? `
🌐 YOUR ORGANIZATION'S CUSTOM URL
${data.subdomainUrl}
Share this link with your students for a branded experience.
` : ''}

📋 YOUR ACCOUNT DETAILS
- Organization: ${data.orgName}
- Email: ${data.email}
- Plan: ${data.plan.toUpperCase()}
- Interview Credits: ${data.quotaLimit}
${data.subdomain ? `- Subdomain: ${data.subdomain}` : ''}

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
Branding: ${data.brandingLink}
Students: ${data.studentsLink}

Need help? Reply to this email or contact support@consularly.com

Best regards,
The Consularly Team

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
