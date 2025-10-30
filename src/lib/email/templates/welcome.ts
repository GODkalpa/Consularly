/**
 * Welcome Email Template
 * Sent when a new user signs up
 */

interface WelcomeEmailData {
  displayName: string;
  email: string;
  profileSetupLink: string;
  dashboardLink: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const subject = `Welcome to Consularly, ${data.displayName}! 🎉`;

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
    .button { display: inline-block; padding: 14px 32px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .button:hover { background-color: #3a327d; }
    .feature-box { background-color: #D8EFF7; border-left: 4px solid #9CBBFC; padding: 15px 20px; margin: 15px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
    .footer a { color: #4840A3; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" class="logo" />
      <h1>Welcome to Consularly! 🎉</h1>
    </div>
    
    <div class="content">
      <h2>Hi ${data.displayName},</h2>
      
      <p>Welcome to Consularly - your AI-powered visa interview preparation platform! We're thrilled to have you on board.</p>
      
      <p>You're now part of a community that's mastering visa interviews with cutting-edge AI technology.</p>
      
      <h3>🚀 Get Started in 3 Easy Steps:</h3>
      
      <div class="feature-box">
        <strong>1. Complete Your Profile</strong><br>
        Set up your student profile to get personalized interview questions tailored to your visa type and background.
      </div>
      
      <div class="feature-box">
        <strong>2. Choose Your Visa Type</strong><br>
        Select from USA F1, UK Student, or France student visa interview preparation.
      </div>
      
      <div class="feature-box">
        <strong>3. Start Practicing</strong><br>
        Begin your first AI-powered mock interview with real-time feedback on your responses, speech quality, and body language.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.profileSetupLink}" class="button">Complete Your Profile →</a>
      </div>
      
      <h3>✨ What You'll Get:</h3>
      <ul>
        <li><strong>AI-Powered Interviews:</strong> Practice with realistic visa interview scenarios</li>
        <li><strong>Real-Time Feedback:</strong> Get instant analysis of your answers, speech, and body language</li>
        <li><strong>Detailed Reports:</strong> Receive comprehensive performance reports with actionable insights</li>
        <li><strong>Progress Tracking:</strong> Monitor your improvement over time</li>
        <li><strong>Country-Specific Prep:</strong> Tailored questions for USA, UK, and France visa interviews</li>
      </ul>
      
      <p><strong>Need Help?</strong><br>
      If you have any questions or need assistance, just reply to this email or visit our dashboard for support resources.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardLink}" class="button">Go to Dashboard</a>
      </div>
      
      <p>Good luck with your visa interview preparation!</p>
      
      <p>Best regards,<br>
      <strong>The Consularly Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p>
        <a href="${data.dashboardLink}">Dashboard</a> • 
        <a href="mailto:support@consularly.com">Support</a> • 
        <a href="#">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to Consularly, ${data.displayName}!

We're thrilled to have you on board. You're now part of a community that's mastering visa interviews with cutting-edge AI technology.

Get Started in 3 Easy Steps:

1. Complete Your Profile
   Set up your student profile to get personalized interview questions.
   ${data.profileSetupLink}

2. Choose Your Visa Type
   Select from USA F1, UK Student, or France student visa preparation.

3. Start Practicing
   Begin your first AI-powered mock interview with real-time feedback.

What You'll Get:
- AI-Powered Interviews: Practice with realistic visa interview scenarios
- Real-Time Feedback: Get instant analysis of your answers, speech, and body language
- Detailed Reports: Receive comprehensive performance reports
- Progress Tracking: Monitor your improvement over time
- Country-Specific Prep: Tailored questions for USA, UK, and France

Dashboard: ${data.dashboardLink}

Need help? Reply to this email or contact support@consularly.com

Best regards,
The Consularly Team

© ${new Date().getFullYear()} Consularly. All rights reserved.
  `;

  return { subject, html, text };
}
