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
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: ${orgColor}; padding: 40px 20px; text-align: center;">
      ${data.orgBranding?.logoUrl ? `<img src="${data.orgBranding.logoUrl}" alt="${orgName}" style="max-height: 60px; margin-bottom: 20px;">` : ''}
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${decisionEmoji} Interview Results Ready</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0;">${data.interviewType} • ${data.interviewDate}</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1e293b; margin-top: 0;">Hi ${data.studentName},</h2>
      
      <p style="color: #475569;">Your AI-powered visa interview simulation has been analyzed. Here are your comprehensive results:</p>
      
      <!-- Score Display -->
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 20px 40px; background-color: ${decisionColor}; color: #ffffff; border-radius: 12px; font-size: 48px; font-weight: bold; margin: 20px 0;">${data.overall}/100</div>
        <br>
        <div style="display: inline-block; padding: 8px 20px; background-color: ${decisionColor}; color: #ffffff; border-radius: 6px; font-weight: 600; margin: 10px 0;">${decisionText}</div>
      </div>
      
      <!-- Summary Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e293b; font-size: 16px;">📊 Performance Summary</h3>
        <p style="color: #475569; margin-bottom: 0;">${data.summary}</p>
      </div>
      
      ${data.strengths.length > 0 ? `
        <h3 style="color: #1e293b; margin-top: 30px;">✅ Key Strengths</h3>
        ${data.strengths.slice(0, 5).map(s => `<div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 12px 16px; margin: 8px 0; border-radius: 0 8px 8px 0;"><span style="color: #166534;">✓ ${s}</span></div>`).join('')}
      ` : ''}
      
      ${data.weaknesses.length > 0 ? `
        <h3 style="color: #1e293b; margin-top: 30px;">⚠️ Areas for Improvement</h3>
        ${data.weaknesses.slice(0, 5).map(w => `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 8px 0; border-radius: 0 8px 8px 0;"><span style="color: #991b1b;">• ${w}</span></div>`).join('')}
      ` : ''}
      
      <!-- What's Next Box -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #1e40af;">💡 What's Next?</strong><br>
        <span style="color: #1d4ed8;">${data.decision === 'accepted' 
          ? 'Great job! You\'re well-prepared. Keep practicing to maintain this level of performance.'
          : data.decision === 'borderline'
          ? 'You\'re on the right track but need to address the weaknesses above. Schedule another practice session focusing on these areas.'
          : 'Significant improvement is needed. Review the detailed report, work on the identified weaknesses, and practice again. Don\'t worry - improvement comes with practice!'
        }</span>
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">📄 Full Detailed Report</h3>
      <p style="color: #475569;">Your complete interview analysis includes:</p>
      <ul style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;">Question-by-question breakdown with scores</li>
        <li style="margin: 8px 0;">Detailed insights on content, speech, and body language</li>
        <li style="margin: 8px 0;">Specific actionable recommendations</li>
        <li style="margin: 8px 0;">Comparison with visa officer expectations</li>
        <li style="margin: 8px 0;">Progress tracking over time</li>
      </ul>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.reportLink}" style="display: inline-block; padding: 16px 40px; background-color: ${orgColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Full Report →</a>
      </div>
      
      <h3 style="color: #1e293b; margin-top: 30px;">🎯 Recommended Next Steps</h3>
      <ol style="color: #475569; padding-left: 20px;">
        <li style="margin: 8px 0;"><strong>Review the full report:</strong> Study the detailed analysis and insights</li>
        <li style="margin: 8px 0;"><strong>Work on weaknesses:</strong> Focus on the specific areas identified above</li>
        <li style="margin: 8px 0;"><strong>Practice again:</strong> Schedule another simulation to track improvement</li>
        ${data.decision !== 'accepted' ? '<li style="margin: 8px 0;"><strong>Seek guidance:</strong> Consult with your counselor about challenging areas</li>' : ''}
      </ol>
      
      <!-- Encouragement Box -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <strong style="color: #92400e;">💪 Remember:</strong>
        <span style="color: #a16207;"> Every interview is a learning opportunity. Use this feedback to improve and build confidence for your actual visa interview!</span>
      </div>
      
      <p style="color: #475569;">Keep practicing and you'll see improvement with each session!</p>
      
      <p style="color: #475569; margin-top: 30px;">Best of luck,<br>
      <strong style="color: #1e293b;">The ${orgName} Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 30px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0;">This is an automated analysis from AI-powered interview simulation</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${data.reportLink}" style="color: ${orgColor}; text-decoration: none;">View Report</a> • 
        <a href="mailto:support@consularly.com" style="color: ${orgColor}; text-decoration: none;">Support</a>
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
