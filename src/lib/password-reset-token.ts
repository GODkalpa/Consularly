import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface ResetTokenPayload {
  email: string
  uid: string
  orgId?: string
  subdomain?: string
}

/**
 * Generate a custom password reset token
 * Valid for 1 hour
 */
export function generatePasswordResetToken(payload: ResetTokenPayload): string {
  return jwt.sign(
    {
      ...payload,
      type: 'password-reset',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

/**
 * Generate the full password reset URL
 * Uses the org's subdomain if available, otherwise main domain
 */
export function generatePasswordResetUrl(
  token: string,
  subdomain?: string
): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com'
  
  // Use subdomain if available
  const baseUrl = subdomain
    ? `https://${subdomain}.${baseDomain}`
    : process.env.NEXT_PUBLIC_BASE_URL || `https://${baseDomain}`
  
  return `${baseUrl}/reset-password?token=${token}`
}
