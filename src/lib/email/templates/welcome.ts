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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #4840A3; padding: 40px 20px; text-align: center;">
      <img src="https://res.cloudinary.com/dpkstuci5/image/upload/v1761822845/email-assets/consularly-logo.png" alt="Consularly" style="max-width: 180px; height: auto; margin-bottom: 10px; background-color: white; padding: 8px; border-radius: 8px;" />
      <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 28px;">Welcome to Consularly! 🎉</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.displayName},</h2>
      
      <p style="color: #475569;">Welcome to Consularly - your AI-powered visa interview preparation platform! We're thrilled to have you on board.</p>
      
      <p style="color: #475569;">You're now part of a community that's mastering visa interviews with cutting-edge AI technology.</p>
      
      <h3 style="color: #1e293b; margin-top: 30px;">🚀 Get Started in 3 Easy Steps:</h3>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #166534;">1. Complete Your Profile</strong><br>
        <span style="color: #15803d;">Set up your student profile to get personalized interview questions tailored to your visa type and background.</span>
      </div>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">2. Choose Your Visa Type</strong><br>
        <span style="color: #1d4ed8;">Select from USA F1, UK Student, or France student visa interview preparation.</span>
      </div>
      
      <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #7e22ce;">3. Start Practicing</strong><br>
        <span style="color: #9333ea;">Begin your first AI-powered mock interview with real-time feedback on your responses, speech quality, and body language.</span>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.profileSetupLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete Your Profile →</a>
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">✨ What You'll Get:</h3>
      <ul style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>AI-Powered Interviews:</strong> Practice with realistic visa interview scenarios</li>
        <li style="margin: 8px 0;"><strong>Real-Time Feedback:</strong> Get instant analysis of your answers, speech, and body language</li>
        <li style="margin: 8px 0;"><strong>Detailed Reports:</strong> Receive comprehensive performance reports with actionable insights</li>
        <li style="margin: 8px 0;"><strong>Progress Tracking:</strong> Monitor your improvement over time</li>
        <li style="margin: 8px 0;"><strong>Country-Specific Prep:</strong> Tailored questions for USA, UK, and France visa interviews</li>
      </ul>
      
      <p style="color: #475569;"><strong style="color: #1e293b;">Need Help?</strong><br>
      If you have any questions or need assistance, just reply to this email or visit our dashboard for support resources.</p>
      
      <!-- Secondary CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.dashboardLink}" style="display: inline-block; padding: 16px 40px; background-color: #4840A3; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
      </div>
      
      <p style="color: #475569;">Good luck with your visa interview preparation!</p>
      
      <p style="color: #475569; margin-top: 30px;">Best regards,<br>
      <strong style="color: #1e293b;">The Consularly Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Consularly. All rights reserved.</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${data.dashboardLink}" style="color: #4840A3; text-decoration: none;">Dashboard</a> • 
        <a href="mailto:support@consularly.com" style="color: #4840A3; text-decoration: none;">Support</a> • 
        <a href="#" style="color: #4840A3; text-decoration: none;">Privacy Policy</a>
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
