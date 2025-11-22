/**
 * Subdomain Utilities
 * 
 * Utilities for extracting, validating, and managing subdomains
 * for organization white-labeling.
 */

// Reserved subdomains that cannot be assigned to organizations
export const RESERVED_SUBDOMAINS = [
  'www',
  'api',
  'admin',
  'app',
  'mail',
  'ftp',
  'smtp',
  'webmail',
  'cpanel',
  'whm',
  'ns1',
  'ns2',
  'localhost',
  'staging',
  'dev',
  'test',
  'demo',
];

/**
 * Extract subdomain from hostname
 * Handles both development (localhost) and production environments
 * 
 * Examples:
 * - acmecorp.consularly.com → "acmecorp"
 * - www.consularly.com → "www"
 * - consularly.com → null
 * - acmecorp.localhost:3000 → "acmecorp"
 * - localhost:3000 → null
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const hostWithoutPort = hostname.split(':')[0];

  // Get base domain from environment or default
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';

  // Handle localhost development
  if (hostWithoutPort.includes('localhost')) {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
      // subdomain.localhost format
      return parts[0];
    }
    // Just "localhost" - no subdomain
    return null;
  }

  // Handle production domain
  const parts = hostWithoutPort.split('.');
  const baseParts = baseDomain.split('.');

  // If hostname has more parts than base domain, extract subdomain
  if (parts.length > baseParts.length) {
    // Get all parts before the base domain
    const subdomainParts = parts.slice(0, parts.length - baseParts.length);
    return subdomainParts.join('.');
  }

  // No subdomain
  return null;
}

/**
 * Validate subdomain format
 * 
 * Rules:
 * - 3-63 characters
 * - Lowercase letters, numbers, and hyphens only
 * - Cannot start or end with hyphen
 * - Cannot be a reserved subdomain
 */
export function validateSubdomainFormat(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  // Check length
  if (subdomain.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters' };
  }

  if (subdomain.length > 63) {
    return { valid: false, error: 'Subdomain must be at most 63 characters' };
  }

  // Check format (lowercase alphanumeric + hyphens)
  const formatRegex = /^[a-z0-9-]+$/;
  if (!formatRegex.test(subdomain)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
    };
  }

  // Cannot start or end with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return { valid: false, error: 'Subdomain cannot start or end with a hyphen' };
  }

  // Check reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { valid: false, error: 'This subdomain is reserved and cannot be used' };
  }

  return { valid: true };
}

/**
 * Check if subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase());
}

/**
 * Check if hostname represents the main portal
 * (www, empty subdomain, or localhost without subdomain)
 */
export function isMainPortal(hostname: string): boolean {
  const subdomain = extractSubdomain(hostname);

  // No subdomain = main portal
  if (!subdomain) {
    return true;
  }

  // www = main portal
  if (subdomain === 'www') {
    return true;
  }

  return false;
}

/**
 * Generate subdomain from organization name
 * Converts name to lowercase, replaces spaces with hyphens, removes special chars
 */
export function generateSubdomainFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 63); // Limit to 63 characters
}

/**
 * Build full subdomain URL
 */
export function buildSubdomainUrl(subdomain: string, path: string = '/'): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const port = process.env.NODE_ENV === 'production' ? '' : ':3000';

  if (process.env.NODE_ENV === 'development') {
    return `${protocol}://${subdomain}.localhost${port}${path}`;
  }

  return `${protocol}://${subdomain}.${baseDomain}${path}`;
}
