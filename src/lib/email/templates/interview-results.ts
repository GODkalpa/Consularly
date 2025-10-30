/**
 * Interview Results Email Template
 * Sent when an interview is completed with detailed results
 */

import type { OrganizationBranding } from '../index';

interface InterviewResultsEmailData {
  studentName: string;
  interviewType: string;
  overall: number;
  decision: 'accepted' | 'rejected' | 'borderline';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reportLink: string;
  orgName?: string;
  orgBranding?: OrganizationBranding;
  interviewDate: string;
}

export function generateInterviewResultsEmail(data: InterviewResultsEmailData): { subject: string; html: string; text: string } {
  const decisionEmoji = {
    accepted: '✅',
    borderline: '⚠️',
    rejected: '❌'
  }[data.decision];

  const decisionText = {
    accepted: 'Strong Performance',
    borderline: 'Needs Improvement',
    rejected: 'Requires Significant Work'
  }[data.decision];

  const decisionColor = {
    accepted: '#059669',
    borderline: '#f59e0b',
    rejected: '#dc2626'
  }[data.decision];

  const orgColor = data.orgBranding?.primaryColor || '#4840A3';
  const orgName = data.orgName || 'Consularly';

  const subject = `${decisionEmoji} Your ${data.interviewType} Interview Results - ${data.overall}/100`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: ${orgColor}; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .score-badge { display: inline-block; padding: 20px 40px; background-color: ${decisionColor}; color: #ffffff; border-radius: 12px; font-size: 48px; font-weight: bold; margin: 20px 0; }
    .decision-badge { display: inline-block; padding: 8px 20px; background-color: ${decisionColor}; color: #ffffff; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .button { display: inline-block; padding: 14px 32px; background-color: ${orgColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .strength { background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; margin: 8px 0; }
    .weakness { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 8px 0; }
    .info-box { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${data.orgBranding?.logoUrl ? `<img src="${data.orgBranding.logoUrl}" alt="${orgName}" style="max-height: 60px; margin-bottom: 20px;">` : ''}
      <h1>${decisionEmoji} Interview Results Ready</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">${data.interviewType} • ${data.interviewDate}</p>
    </div>
    
    <div class="content">
      <h2>Hi ${data.studentName},</h2>
      
      <p>Your AI-powered visa interview simulation has been analyzed. Here are your comprehensive results:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div class="score-badge">${data.overall}/100</div>
        <br>
        <div class="decision-badge">${decisionText}</div>
      </div>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📊 Performance Summary</h3>
        <p>${data.summary}</p>
      </div>
      
      ${data.strengths.length > 0 ? `
        <h3>✅ Key Strengths</h3>
        ${data.strengths.slice(0, 5).map(s => `<div class="strength">✓ ${s}</div>`).join('')}
      ` : ''}
      
      ${data.weaknesses.length > 0 ? `
        <h3>⚠️ Areas for Improvement</h3>
        ${data.weaknesses.slice(0, 5).map(w => `<div class="weakness">• ${w}</div>`).join('')}
      ` : ''}
      
      <div style="background-color: #D8EFF7; border-left: 4px solid #9CBBFC; padding: 15px 20px; margin: 25px 0;">
        <strong>💡 What's Next?</strong><br>
        ${data.decision === 'accepted' 
          ? 'Great job! You\'re well-prepared. Keep practicing to maintain this level of performance.'
          : data.decision === 'borderline'
          ? 'You\'re on the right track but need to address the weaknesses above. Schedule another practice session focusing on these areas.'
          : 'Significant improvement is needed. Review the detailed report, work on the identified weaknesses, and practice again. Don\'t worry - improvement comes with practice!'
        }
      </div>
      
      <h3>📄 Full Detailed Report</h3>
      <p>Your complete interview analysis includes:</p>
      <ul>
        <li>Question-by-question breakdown with scores</li>
        <li>Detailed insights on content, speech, and body language</li>
        <li>Specific actionable recommendations</li>
        <li>Comparison with visa officer expectations</li>
        <li>Progress tracking over time</li>
      </ul>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.reportLink}" class="button">View Full Report →</a>
      </div>
      
      <h3>🎯 Recommended Next Steps</h3>
      <ol>
        <li><strong>Review the full report:</strong> Study the detailed analysis and insights</li>
        <li><strong>Work on weaknesses:</strong> Focus on the specific areas identified above</li>
        <li><strong>Practice again:</strong> Schedule another simulation to track improvement</li>
        ${data.decision !== 'accepted' ? '<li><strong>Seek guidance:</strong> Consult with your counselor about challenging areas</li>' : ''}
      </ol>
      
      <div style="background-color: #FFF8E1; border-left: 4px solid #F9CD6A; padding: 15px 20px; margin: 20px 0;">
        <strong>💪 Remember:</strong> Every interview is a learning opportunity. Use this feedback to improve and build confidence for your actual visa interview!
      </div>
      
      <p>Keep practicing and you'll see improvement with each session!</p>
      
      <p>Best of luck,<br>
      <strong>The ${orgName} Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated analysis from AI-powered interview simulation</p>
      <p>
        <a href="${data.reportLink}" style="color: ${orgColor};">View Report</a> • 
        <a href="mailto:support@consularly.com" style="color: ${orgColor};">Support</a>
      </p>
      <p style="margin-top: 20px; color: #94a3b8; font-size: 12px;">
        Powered by Consularly • © ${new Date().getFullYear()} All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${decisionEmoji} Your ${data.interviewType} Interview Results

Hi ${data.studentName},

Your AI-powered visa interview simulation has been analyzed.

SCORE: ${data.overall}/100
ASSESSMENT: ${decisionText}
DATE: ${data.interviewDate}

PERFORMANCE SUMMARY
${data.summary}

${data.strengths.length > 0 ? `
KEY STRENGTHS
${data.strengths.slice(0, 5).map(s => `✓ ${s}`).join('\n')}
` : ''}

${data.weaknesses.length > 0 ? `
AREAS FOR IMPROVEMENT
${data.weaknesses.slice(0, 5).map(w => `• ${w}`).join('\n')}
` : ''}

WHAT'S NEXT?
${data.decision === 'accepted' 
  ? 'Great job! You\'re well-prepared. Keep practicing to maintain this level.'
  : data.decision === 'borderline'
  ? 'You\'re on the right track but need to address the weaknesses above. Practice focusing on these areas.'
  : 'Significant improvement is needed. Review the report, work on identified weaknesses, and practice again.'
}

FULL DETAILED REPORT
Your complete analysis includes:
- Question-by-question breakdown with scores
- Detailed insights on content, speech, and body language
- Specific actionable recommendations
- Comparison with visa officer expectations
- Progress tracking over time

View Full Report: ${data.reportLink}

RECOMMENDED NEXT STEPS
1. Review the full report: Study the detailed analysis
2. Work on weaknesses: Focus on specific areas identified
3. Practice again: Schedule another simulation to track improvement
${data.decision !== 'accepted' ? '4. Seek guidance: Consult with your counselor about challenging areas' : ''}

💪 Remember: Every interview is a learning opportunity. Use this feedback to improve!

Best of luck,
The ${orgName} Team

---
Powered by Consularly
View Report: ${data.reportLink}
Support: support@consularly.com
  `;

  return { subject, html, text };
}
