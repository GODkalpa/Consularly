import jwt from 'jsonwebtoken';
import type { OrganizationBranding } from '@/types/firestore';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';

export interface StudentInvitationData {
  studentName: string;
  studentEmail: string;
  organizationName: string;
  organizationBranding: OrganizationBranding;
  initialCredits: number;
  invitationToken: string;
  orgSubdomain?: string;        // Organization's subdomain (e.g., 'acme')
  orgSubdomainEnabled?: boolean; // Whether subdomain is enabled for this org
}

/**
 * Generates a secure invitation token for student account setup
 * Token expires in 7 days and contains student email + timestamp
 */
export function generateInvitationToken(): string {
  const payload = {
    type: 'student_invitation',
    timestamp: Date.now(),
    expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes an invitation token
 * Returns null if invalid or expired
 */
export function verifyInvitationToken(token: string): any | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('[Invitation] Token verification failed:', error);
    return null;
  }
}

/**
 * Sends a branded invitation email to a student using Brevo
 * Uses org branding for white-labeled experience
 */
export async function sendStudentInvitationEmail(data: StudentInvitationData): Promise<void> {
  const { studentName, studentEmail, organizationName, organizationBranding, initialCredits, invitationToken, orgSubdomain, orgSubdomainEnabled } = data;
  
  console.log('[StudentInvitation] Starting email send process:', {
    studentEmail,
    organizationName,
    hasToken: !!invitationToken,
    initialCredits,
    orgSubdomain,
    orgSubdomainEnabled
  });
  
  // Use existing email service
  try {
    const { sendStudentInvitation } = await import('@/lib/email-service');
    
    // Generate invitation URL - use org subdomain if available and enabled
    let invitationUrl: string;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
    
    if (orgSubdomain && orgSubdomainEnabled) {
      // Use org's subdomain URL (e.g., https://acme.consularly.com)
      invitationUrl = `https://${orgSubdomain}.${baseDomain}/student/setup?token=${invitationToken}`;
    } else {
      // Fallback to main app URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${baseDomain}`;
      invitationUrl = `${baseUrl}/student/setup?token=${invitationToken}`;
    }
    
    console.log('[StudentInvitation] Generated invitation URL:', invitationUrl);
    
    // Send invitation using the dedicated function
    await sendStudentInvitation({
      to: studentEmail,
      studentName,
      orgName: organizationName,
      orgBranding: organizationBranding,
      initialCredits,
      invitationUrl,
      expiryDays: 7
    });
    
    console.log(`[StudentInvitation] ✅ Email sent successfully to ${studentEmail} from ${organizationName}`);
    
  } catch (error) {
    // Fallback: Log invitation details if email service unavailable
    console.error('[StudentInvitation] ❌ Email service error:', error);
    
    // Generate fallback URL with subdomain if available
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
    let setupUrl: string;
    if (orgSubdomain && orgSubdomainEnabled) {
      setupUrl = `https://${orgSubdomain}.${baseDomain}/student/setup?token=${invitationToken}`;
    } else {
      setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${baseDomain}`}/student/setup?token=${invitationToken}`;
    }
    
    console.log('[Invitation] Manual setup required for:', {
      studentEmail,
      studentName,
      organizationName,
      initialCredits,
      invitationToken,
      setupUrl
    });
    
    // Re-throw error so caller knows email failed
    throw new Error(`Failed to send invitation email: ${error}`);
  }
}

/**
 * Creates a shareable invitation link for testing/manual distribution
 * Optionally uses org subdomain if provided
 */
export function createInvitationLink(token: string, orgSubdomain?: string, orgSubdomainEnabled?: boolean): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
  
  if (orgSubdomain && orgSubdomainEnabled) {
    return `https://${orgSubdomain}.${baseDomain}/student/setup?token=${token}`;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${baseDomain}`;
  return `${baseUrl}/student/setup?token=${token}`;
}

/**
 * Validates invitation token and extracts metadata
 * Used by the student setup page
 */
export function parseInvitationToken(token: string): { valid: boolean; expired: boolean; data?: any } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'student_invitation') {
      return { valid: false, expired: false };
    }
    
    const now = Date.now();
    if (decoded.expires && now > decoded.expires) {
      return { valid: false, expired: true };
    }
    
    return { valid: true, expired: false, data: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, expired: true };
    }
    return { valid: false, expired: false };
  }
}
