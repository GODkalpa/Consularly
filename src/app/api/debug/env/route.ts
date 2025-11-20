import { NextResponse } from 'next/server';

// DEBUG ONLY - Remove in production
export async function GET() {
  return NextResponse.json({
    hasSMTPHost: !!process.env.SMTP_HOST,
    hasSMTPUser: !!process.env.SMTP_USER,
    hasSMTPPassword: !!process.env.SMTP_PASSWORD,
    smtpPort: process.env.SMTP_PORT,
    defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL,
    defaultSenderName: process.env.DEFAULT_SENDER_NAME,
    orgSupportEmail: process.env.ORG_SUPPORT_EMAIL,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('SMTP') || k.includes('EMAIL') || k.includes('SENDER')
    ),
  });
}
