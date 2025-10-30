import { NextResponse } from 'next/server';

// DEBUG ONLY - Remove in production
export async function GET() {
  return NextResponse.json({
    hasBrevoKey: !!process.env.BREVO_API_KEY,
    brevoKeyLength: process.env.BREVO_API_KEY?.length || 0,
    brevoKeyPrefix: process.env.BREVO_API_KEY?.substring(0, 10) || 'not found',
    fromEmail: process.env.EMAIL_FROM_ADDRESS,
    fromName: process.env.EMAIL_FROM_NAME,
    replyTo: process.env.EMAIL_REPLY_TO,
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('BREVO') || k.includes('EMAIL')
    ),
  });
}
