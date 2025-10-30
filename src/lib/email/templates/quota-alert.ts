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
    .header { background-color: ${urgency.color}; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 10px 0 0 0; font-size: 28px; }
    .logo { max-width: 180px; height: auto; margin-bottom: 10px; }
    .content { padding: 40px 30px; }
    .progress-bar { width: 100%; height: 30px; background-color: #e5e7eb; border-radius: 15px; overflow: hidden; margin: 20px 0; }
    .progress-fill { height: 100%; background-color: ${urgency.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: width 0.3s; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .stat-box { background-color: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-number { font-size: 32px; font-weight: bold; color: ${urgency.color}; }
    .button { display: inline-block; padding: 14px 32px; background-color: ${urgency.color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .alert-box { background-color: #fef2f2; border: 2px solid ${urgency.color}; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${appUrl}/Consularly.png" alt="Consularly" class="logo" />
      <h1>${urgency.emoji} Quota ${urgency.level}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">${data.orgName}</p>
    </div>
    
    <div class="content">
      <h2>Hi ${data.adminName},</h2>
      
      <p>Your organization has reached <strong>${percentage}%</strong> of your interview quota limit. ${urgency.action}.</p>
      
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%;">${percentage}%</div>
      </div>
      
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-number">${data.quotaUsed}</div>
          <div style="color: #64748b; font-size: 14px;">Interviews Used</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${remaining}</div>
          <div style="color: #64748b; font-size: 14px;">Remaining</div>
        </div>
      </div>
      
      <div class="alert-box">
        <h3 style="margin-top: 0; color: ${urgency.color};">${urgency.emoji} ${urgency.action}</h3>
        ${data.threshold === '100%' 
          ? '<p><strong>Your quota is exhausted.</strong> No more interviews can be conducted until you upgrade your plan or purchase additional credits.</p>'
          : data.threshold === '90%'
          ? '<p><strong>You\'re running low on interview credits.</strong> To avoid disruptions, consider upgrading your plan soon.</p>'
          : '<p><strong>You\'ve used 75% of your quota.</strong> Plan ahead to ensure uninterrupted service for your students.</p>'
        }
      </div>
      
      <h3>📊 Usage Breakdown</h3>
      <ul>
        <li><strong>Total Quota:</strong> ${data.quotaLimit} interviews</li>
        <li><strong>Used:</strong> ${data.quotaUsed} interviews (${percentage}%)</li>
        <li><strong>Remaining:</strong> ${remaining} interviews</li>
      </ul>
      
      <h3>🚀 What You Can Do</h3>
      <ol>
        <li><strong>Upgrade Your Plan:</strong> Get more interview credits with a higher tier plan</li>
        <li><strong>Purchase Credits:</strong> Buy additional interview credits as needed</li>
        <li><strong>Monitor Usage:</strong> Track quota usage in your dashboard to plan ahead</li>
        ${data.threshold !== '100%' ? '<li><strong>Prioritize Students:</strong> Focus remaining interviews on students who need them most</li>' : ''}
      </ol>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.upgradeLink}" class="button">Upgrade Plan</a>
        <a href="${data.dashboardLink}" class="button" style="background-color: #1d4ed8;">View Dashboard</a>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 0;">
        <strong>💡 Pro Tip:</strong> Set up automatic notifications in your dashboard to receive alerts before hitting quota limits. This helps you plan upgrades proactively.
      </div>
      
      <p><strong>Need Help?</strong><br>
      Our team is here to help you choose the right plan for your needs. Reply to this email or contact us at support@consularly.com</p>
      
      <p>Best regards,<br>
      <strong>The Consularly Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="${data.dashboardLink}" style="color: #1d4ed8;">Dashboard</a> • 
        <a href="${data.upgradeLink}" style="color: #1d4ed8;">Upgrade</a> • 
        <a href="mailto:support@consularly.com" style="color: #1d4ed8;">Support</a>
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
