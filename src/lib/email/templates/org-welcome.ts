/**
 * Organization Welcome Email Template
 * Sent when a new organization is created
 */

interface OrgWelcomeEmailData {
  adminName: string;
  orgName: string;
  orgId: string;
  plan: 'basic' | 'premium' | 'enterprise';
  quotaLimit: number;
  dashboardLink: string;
  brandingLink: string;
  studentsLink: string;
}

export function generateOrgWelcomeEmail(data: OrgWelcomeEmailData): { subject: string; html: string; text: string } {
  const subject = `Welcome to Consularly - ${data.orgName} is All Set! 🚀`;

  const planFeatures = {
    basic: ['Logo customization', 'Primary color branding', 'Company name display'],
    premium: ['All Basic features', 'Secondary colors', 'Tagline & welcome message', 'Background images', 'Custom fonts', 'Social links'],
    enterprise: ['All Premium features', 'White-label mode', 'Priority support', 'Advanced analytics']
  };


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
    .feature-box { background-color: #D8EFF7; border-left: 4px solid #9CBBFC; padding: 15px 20px; margin: 15px 0; }
    .badge { display: inline-block; padding: 4px 12px; background-color: #4840A3; color: #ffffff; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .stat-box { background-color: #D8EFF7; border-radius: 8px; padding: 20px; text-align: center; margin: 10px; display: inline-block; min-width: 150px; }
    .stat-number { font-size: 32px; font-weight: bold; color: #4840A3; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" class="logo" />
      <h1>🎉 ${data.orgName} is Live!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">Your organization is ready to start preparing students for visa interviews</p>
    </div>
    
    <div class="content">
      <h2>Hi ${data.adminName},</h2>
      
      <p>Congratulations! Your organization <strong>${data.orgName}</strong> has been successfully set up on Consularly. You can now start managing students and conducting AI-powered visa interview simulations.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div class="stat-box">
          <div class="stat-number">${data.quotaLimit}</div>
          <div style="color: #64748b; font-size: 14px;">Interview Credits</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${data.plan.toUpperCase()}</div>
          <div style="color: #64748b; font-size: 14px;">Plan Tier</div>
        </div>
      </div>
      
      <h3>🚀 Quick Start Guide</h3>
      
      <div class="feature-box">
        <strong>1. Customize Your Branding</strong><br>
        Add your logo, colors, and company information to create a branded experience for your students.
        <div style="margin-top: 10px;">
          <a href="${data.brandingLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Customize Branding →</a>
        </div>
      </div>
      
      <div class="feature-box">
        <strong>2. Add Your First Students</strong><br>
        Create student accounts and start assigning interview practices.
        <div style="margin-top: 10px;">
          <a href="${data.studentsLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Manage Students →</a>
        </div>
      </div>
      
      <div class="feature-box">
        <strong>3. Start Interview Simulations</strong><br>
        Begin conducting AI-powered mock interviews for USA, UK, or France visa preparation.
        <div style="margin-top: 10px;">
          <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Go to Dashboard →</a>
        </div>
      </div>
      
      <h3>✨ Your ${data.plan.toUpperCase()} Plan Features</h3>
      <ul>
        ${planFeatures[data.plan].map(feature => `<li>${feature}</li>`).join('')}
      </ul>
      
      <h3>📊 What You Can Do</h3>
      <ul>
        <li><strong>Student Management:</strong> Add, edit, and track student profiles</li>
        <li><strong>Interview Simulations:</strong> Conduct realistic AI-powered visa interviews</li>
        <li><strong>Performance Analytics:</strong> View detailed reports and track progress</li>
        <li><strong>Quota Management:</strong> Monitor usage and manage interview credits</li>
        <li><strong>Custom Branding:</strong> White-label the platform with your organization's identity</li>
        <li><strong>Multi-Country Support:</strong> Prepare students for USA, UK, and France visas</li>
      </ul>
      
      <h3>💡 Pro Tips for Success</h3>
      <ol>
        <li><strong>Set Up Branding First:</strong> Create a professional branded experience before adding students</li>
        <li><strong>Import Student Lists:</strong> Save time by preparing student data in advance</li>
        <li><strong>Review Reports Weekly:</strong> Track student progress and identify areas needing attention</li>
        <li><strong>Monitor Quota:</strong> Keep an eye on your interview credits and plan upgrades proactively</li>
      </ol>
      
      <div style="background-color: #FFF8E1; border-left: 4px solid #F9CD6A; padding: 15px 20px; margin: 20px 0;">
        <strong>📞 Need Help?</strong><br>
        Our support team is here to help you get the most out of Consularly. Reply to this email or contact us at support@consularly.com
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.dashboardLink}" class="button">Go to Organization Dashboard</a>
        <a href="${data.brandingLink}" class="button" style="background-color: #F9CD6A; color: #000;">Customize Branding</a>
      </div>
      
      <p>We're excited to see ${data.orgName} help students achieve their visa interview goals!</p>
      
      <p>Best regards,<br>
      <strong>The Consularly Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="${data.dashboardLink}" style="color: #4840A3;">Dashboard</a> • 
        <a href="mailto:support@consularly.com" style="color: #4840A3;">Support</a> • 
        <a href="#" style="color: #4840A3;">Documentation</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${data.orgName} is Live on Consularly! 🎉

Hi ${data.adminName},

Congratulations! Your organization ${data.orgName} has been successfully set up on Consularly.

YOUR ORGANIZATION DETAILS
- Interview Credits: ${data.quotaLimit}
- Plan: ${data.plan.toUpperCase()}

QUICK START GUIDE

1. Customize Your Branding
   Add your logo, colors, and company information.
   ${data.brandingLink}

2. Add Your First Students
   Create student accounts and assign interviews.
   ${data.studentsLink}

3. Start Interview Simulations
   Begin AI-powered mock interviews.
   ${data.dashboardLink}

YOUR ${data.plan.toUpperCase()} PLAN FEATURES
${planFeatures[data.plan].map(f => `- ${f}`).join('\n')}

WHAT YOU CAN DO
- Student Management: Add, edit, and track student profiles
- Interview Simulations: Conduct realistic AI-powered interviews
- Performance Analytics: View detailed reports and track progress
- Quota Management: Monitor usage and manage credits
- Custom Branding: White-label with your organization's identity
- Multi-Country Support: USA, UK, and France visa preparation

PRO TIPS
1. Set Up Branding First - Create professional branded experience
2. Import Student Lists - Prepare student data in advance
3. Review Reports Weekly - Track progress and identify needs
4. Monitor Quota - Plan upgrades proactively

Dashboard: ${data.dashboardLink}
Branding: ${data.brandingLink}

Need help? Reply to this email or contact support@consularly.com

Best regards,
The Consularly Team

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
