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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #4840A3; padding: 40px 20px; text-align: center;">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" style="max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">🎉 ${data.orgName} is Live!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">Your organization is ready to start preparing students for visa interviews</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.adminName},</h2>
      
      <p style="color: #475569;">Congratulations! Your organization <strong style="color: #4840A3;">${data.orgName}</strong> has been successfully set up on Consularly. You can now start managing students and conducting AI-powered visa interview simulations.</p>
      
      <!-- Stats -->
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #D8EFF7; border-radius: 8px; padding: 20px; text-align: center; margin: 10px; display: inline-block; min-width: 150px;">
          <div style="font-size: 32px; font-weight: bold; color: #4840A3;">${data.quotaLimit}</div>
          <div style="color: #64748b; font-size: 14px;">Interview Credits</div>
        </div>
        <div style="background-color: #D8EFF7; border-radius: 8px; padding: 20px; text-align: center; margin: 10px; display: inline-block; min-width: 150px;">
          <div style="font-size: 32px; font-weight: bold; color: #4840A3;">${data.plan.toUpperCase()}</div>
          <div style="color: #64748b; font-size: 14px;">Plan Tier</div>
        </div>
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">🚀 Quick Start Guide</h3>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #166534;">1. Customize Your Branding</strong><br>
        <span style="color: #15803d;">Add your logo, colors, and company information to create a branded experience for your students.</span>
        <div style="margin-top: 10px;">
          <a href="${data.brandingLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Customize Branding →</a>
        </div>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">2. Add Your First Students</strong><br>
        <span style="color: #1d4ed8;">Create student accounts and start assigning interview practices.</span>
        <div style="margin-top: 10px;">
          <a href="${data.studentsLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Manage Students →</a>
        </div>
      </div>
      
      <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #7e22ce;">3. Start Interview Simulations</strong><br>
        <span style="color: #9333ea;">Begin conducting AI-powered mock interviews for USA, UK, or France visa preparation.</span>
        <div style="margin-top: 10px;">
          <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none; font-weight: 600;">Go to Dashboard →</a>
        </div>
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">✨ Your ${data.plan.toUpperCase()} Plan Features</h3>
      <ul style="color: #475569; padding-left: 20px;">
        ${planFeatures[data.plan].map(feature => `<li style="margin: 8px 0;">${feature}</li>`).join('')}
      </ul>
      
      <h3 style="color: #1e293b; margin-top: 30px;">📊 What You Can Do</h3>
      <ul style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Student Management:</strong> Add, edit, and track student profiles</li>
        <li style="margin: 8px 0;"><strong>Interview Simulations:</strong> Conduct realistic AI-powered visa interviews</li>
        <li style="margin: 8px 0;"><strong>Performance Analytics:</strong> View detailed reports and track progress</li>
        <li style="margin: 8px 0;"><strong>Quota Management:</strong> Monitor usage and manage interview credits</li>
        <li style="margin: 8px 0;"><strong>Custom Branding:</strong> White-label the platform with your organization's identity</li>
        <li style="margin: 8px 0;"><strong>Multi-Country Support:</strong> Prepare students for USA, UK, and France visas</li>
      </ul>
      
      <h3 style="color: #1e293b; margin-top: 30px;">💡 Pro Tips for Success</h3>
      <ol style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Set Up Branding First:</strong> Create a professional branded experience before adding students</li>
        <li style="margin: 8px 0;"><strong>Import Student Lists:</strong> Save time by preparing student data in advance</li>
        <li style="margin: 8px 0;"><strong>Review Reports Weekly:</strong> Track student progress and identify areas needing attention</li>
        <li style="margin: 8px 0;"><strong>Monitor Quota:</strong> Keep an eye on your interview credits and plan upgrades proactively</li>
      </ol>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">📞 Need Help?</strong><br>
        <span style="color: #a16207;">Our support team is here to help you get the most out of Consularly. Reply to this email or contact us at support@consularly.com</span>
      </div>
      
      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.dashboardLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 5px;">Go to Organization Dashboard</a>
        <a href="${data.brandingLink}" style="display: inline-block; padding: 16px 40px; background-color: #F9CD6A; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 5px;">Customize Branding</a>
      </div>
      
      <p style="color: #475569;">We're excited to see ${data.orgName} help students achieve their visa interview goals!</p>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">The Consularly Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none;">Dashboard</a> • 
        <a href="mailto:support@consularly.com" style="color: #4840A3; text-decoration: none;">Support</a> • 
        <a href="#" style="color: #4840A3; text-decoration: none;">Documentation</a>
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
