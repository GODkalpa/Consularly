/**
 * Email Alias Generator Utility
 * Generates and validates organization-specific email aliases
 */

const EMAIL_DOMAIN = 'consularly.com';
const MAX_ALIAS_LENGTH = 50;
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const ALIAS_PATTERN = /^[a-z0-9-]+@consularly\.com$/;

/**
 * Create URL-safe slug from organization name
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * Takes first two words for better identification (e.g., "sumedha-education")
 */
export function createOrgSlug(orgName: string): string {
  // Split into words and take first two
  const words = orgName.split(/\s+/).filter(word => word.length > 0);
  const firstTwoWords = words.slice(0, 2).join('-');
  
  return firstTwoWords
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')     // Remove special characters
    .replace(/-+/g, '-')            // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}

/**
 * Generate email alias from organization name
 * Format: {first-last}@consularly.com (e.g., sumedha-education@consularly.com)
 * Takes the first two words of the organization name
 */
export function generateEmailAlias(orgName: string): string {
  const slug = createOrgSlug(orgName);
  
  if (!slug) {
    throw new Error('Cannot generate email alias: organization name produces empty slug');
  }
  
  const alias = `${slug}@${EMAIL_DOMAIN}`;
  
  // Validate the generated alias
  const validation = validateEmailAlias(alias);
  if (!validation.valid) {
    throw new Error(`Generated invalid email alias: ${validation.error}`);
  }
  
  return alias;
}

/**
 * Validate email alias format
 * Returns validation result with error message if invalid
 */
export function validateEmailAlias(alias: string): { valid: boolean; error?: string } {
  if (!alias) {
    return { valid: false, error: 'Email alias is required' };
  }
  
  if (alias.length > MAX_ALIAS_LENGTH) {
    return { 
      valid: false, 
      error: `Email alias too long (max ${MAX_ALIAS_LENGTH} characters)` 
    };
  }
  
  if (!ALIAS_PATTERN.test(alias)) {
    return { 
      valid: false, 
      error: 'Invalid format. Must be {name}@consularly.com with lowercase letters, numbers, and hyphens only' 
    };
  }
  
  // Extract slug portion (everything before @)
  const slug = alias.replace(`@${EMAIL_DOMAIN}`, '');
  
  if (!SLUG_PATTERN.test(slug)) {
    return { 
      valid: false, 
      error: 'Email name must contain only lowercase letters, numbers, and hyphens' 
    };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { 
      valid: false, 
      error: 'Email name cannot start or end with a hyphen' 
    };
  }
  
  if (slug.includes('--')) {
    return { 
      valid: false, 
      error: 'Email name cannot contain consecutive hyphens' 
    };
  }
  
  // Check for reserved email addresses
  const reservedNames = ['info', 'admin', 'support', 'noreply', 'no-reply', 'contact', 'help', 'sales'];
  if (reservedNames.includes(slug)) {
    return {
      valid: false,
      error: `'${slug}' is a reserved email address. Please use a different name.`
    };
  }
  
  return { valid: true };
}

/**
 * Extract organization slug from email alias
 */
export function extractSlugFromAlias(alias: string): string | null {
  const validation = validateEmailAlias(alias);
  if (!validation.valid) {
    return null;
  }
  
  return alias.replace(`@${EMAIL_DOMAIN}`, '');
}
