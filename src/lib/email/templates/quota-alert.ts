/**
 * Quota Alert Email Template
 * Sent when organization reaches quota thresholds
 */

interface QuotaAlertEmailData {
  orgName: string;
  adminName: string;
  threshold: '75%' | '90%' | '100%';
  quotaUsed: number;
  quotaLimit: number;
  dashboardLink: string;
  upgradeLink: string;
}

export function generateQuotaAlertEmail(data: QuotaAlertEmailData): { subject: string; html: string; text: string } {
  const percentage = Math.round((data.quotaUsed / data.quotaLimit) * 100);
  const remaining = data.quotaLimit - data.quotaUsed;
  
  const urgency = {
    '75%': { emoji: '⚠️', color: '#f59e0b', level: 'Warning', action: 'Consider planning ahead' },
    '90%': { emoji: '🚨', color: '#dc2626', level: 'Alert', action: 'Action needed soon' },
    '100%': { emoji: '🛑', color: '#991b1b', level: 'Critical', action: 'Immediate action required' }
  }[data.threshold];

  const subject = `${urgency.emoji} ${data.orgName} - ${percentage}% Quota Used`;

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
    <div style="background-color: ${urgency.color}; padding: 40px 20px; text-align: center;">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" style="max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">${urgency.emoji} Quota ${urgency.level}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">${data.orgName}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.adminName},</h2>
      
      <p style="color: #475569;">Your organization has reached <strong style="color: ${urgency.color};">${percentage}%</strong> of your interview quota limit. ${urgency.action}.</p>
      
      <!-- Progress Bar -->
      <div style="width: 100%; height: 30px; background-color: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 20px 0;">
        <div style="height: 100%; width: ${percentage}%; background-color: ${urgency.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${percentage}%</div>
      </div>
      
      <!-- Stats Grid -->
      <div style="margin: 25px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-spacing: 15px 0;">
          <tr>
            <td style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 32px; font-weight: bold; color: ${urgency.color};">${data.quotaUsed}</div>
              <div style="color: #64748b; font-size: 14px;">Interviews Used</div>
            </td>
            <td style="background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; width: 50%;">
              <div style="font-size: 32px; font-weight: bold; color: ${urgency.color};">${remaining}</div>
              <div style="color: #64748b; font-size: 14px;">Remaining</div>
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Alert Box -->
      <div style="background-color: #fef2f2; border: 2px solid ${urgency.color}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: ${urgency.color};">${urgency.emoji} ${urgency.action}</h3>
        ${data.threshold === '100%' 
          ? '<p style="color: #991b1b; margin-bottom: 0;"><strong>Your quota is exhausted.</strong> No more interviews can be conducted until you upgrade your plan or purchase additional credits.</p>'
          : data.threshold === '90%'
          ? '<p style="color: #991b1b; margin-bottom: 0;"><strong>You\'re running low on interview credits.</strong> To avoid disruptions, consider upgrading your plan soon.</p>'
          : '<p style="color: #991b1b; margin-bottom: 0;"><strong>You\'ve used 75% of your quota.</strong> Plan ahead to ensure uninterrupted service for your students.</p>'
        }
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">📊 Usage Breakdown</h3>
      <ul style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Total Quota:</strong> ${data.quotaLimit} interviews</li>
        <li style="margin: 8px 0;"><strong>Used:</strong> ${data.quotaUsed} interviews (${percentage}%)</li>
        <li style="margin: 8px 0;"><strong>Remaining:</strong> ${remaining} interviews</li>
      </ul>
      
      <h3 style="color: #1e293b; margin-top: 30px;">🚀 What You Can Do</h3>
      <ol style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Upgrade Your Plan:</strong> Get more interview credits with a higher tier plan</li>
        <li style="margin: 8px 0;"><strong>Purchase Credits:</strong> Buy additional interview credits as needed</li>
        <li style="margin: 8px 0;"><strong>Monitor Usage:</strong> Track quota usage in your dashboard to plan ahead</li>
        ${data.threshold !== '100%' ? '<li style="margin: 8px 0;"><strong>Prioritize Students:</strong> Focus remaining interviews on students who need them most</li>' : ''}
      </ol>
      
      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.upgradeLink}" style="display: inline-block; padding: 16px 40px; background-color: ${urgency.color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 5px;">Upgrade Plan</a>
        <a href="${data.dashboardLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 5px;">View Dashboard</a>
      </div>
      
      <!-- Pro Tip Box -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">💡 Pro Tip:</strong>
        <span style="color: #1d4ed8;"> Set up automatic notifications in your dashboard to receive alerts before hitting quota limits. This helps you plan upgrades proactively.</span>
      </div>
      
      <p style="color: #475569;"><strong style="color: #1e293b;">Need Help?</strong><br>
      Our team is here to help you choose the right plan for your needs. Reply to this email or contact us at support@consularly.com</p>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">The Consularly Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none;">Dashboard</a> • 
        <a href="${data.upgradeLink}" style="color: #4840A3; text-decoration: none;">Upgrade</a> • 
        <a href="mailto:support@consularly.com" style="color: #4840A3; text-decoration: none;">Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${urgency.emoji} Quota ${urgency.level} - ${data.orgName}

Hi ${data.adminName},

Your organization has reached ${percentage}% of your interview quota limit.
${urgency.action}.

QUOTA STATUS
━━━━━━━━━━━━━━━━━━━━
Used:      ${data.quotaUsed} / ${data.quotaLimit} interviews
Remaining: ${remaining} interviews
Progress:  ${'█'.repeat(Math.floor(percentage/10))}${'░'.repeat(10-Math.floor(percentage/10))} ${percentage}%

${data.threshold === '100%' 
  ? '🛑 YOUR QUOTA IS EXHAUSTED\nNo more interviews can be conducted until you upgrade your plan or purchase additional credits.'
  : data.threshold === '90%'
  ? '🚨 RUNNING LOW ON CREDITS\nTo avoid disruptions, consider upgrading your plan soon.'
  : '⚠️ APPROACHING QUOTA LIMIT\nPlan ahead to ensure uninterrupted service for your students.'
}

WHAT YOU CAN DO
1. Upgrade Your Plan - Get more interview credits
2. Purchase Credits - Buy additional credits as needed
3. Monitor Usage - Track quota in your dashboard
${data.threshold !== '100%' ? '4. Prioritize Students - Focus remaining interviews wisely' : ''}

Dashboard: ${data.dashboardLink}
Upgrade: ${data.upgradeLink}

💡 Pro Tip: Set up automatic notifications to receive alerts before hitting limits.

Need help? Reply to this email or contact support@consularly.com

Best regards,
The Consularly Team

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
