/**
 * Branding Validator Utility
 * 
 * Validates organization branding inputs and enforces plan restrictions.
 */

import { OrganizationBranding } from '@/types/firestore';
import { validateCSS } from './css-sanitizer';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export type OrganizationPlan = 'basic' | 'premium' | 'enterprise';

/**
 * Validate organization branding data
 */
export function validateBranding(
  branding: Partial<OrganizationBranding>,
  plan: OrganizationPlan = 'basic'
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate colors
  if (branding.primaryColor && !isValidColor(branding.primaryColor)) {
    errors.primaryColor = 'Invalid color format. Use hex (#RRGGBB), rgb(), rgba(), hsl(), or hsla()';
  }

  if (branding.secondaryColor && !isValidColor(branding.secondaryColor)) {
    errors.secondaryColor = 'Invalid color format. Use hex (#RRGGBB), rgb(), rgba(), hsl(), or hsla()';
  }

  if (branding.backgroundColor && !isValidColor(branding.backgroundColor)) {
    errors.backgroundColor = 'Invalid color format. Use hex (#RRGGBB), rgb(), rgba(), hsl(), or hsla()';
  }

  // Validate URLs
  if (branding.logoUrl && !isValidUrl(branding.logoUrl)) {
    errors.logoUrl = 'Invalid logo URL';
  }

  if (branding.logoLight && !isValidUrl(branding.logoLight)) {
    errors.logoLight = 'Invalid light logo URL';
  }

  if (branding.logoDark && !isValidUrl(branding.logoDark)) {
    errors.logoDark = 'Invalid dark logo URL';
  }

  if (branding.favicon && !isValidUrl(branding.favicon)) {
    errors.favicon = 'Invalid favicon URL';
  }

  if (branding.backgroundImage && !isValidUrl(branding.backgroundImage)) {
    errors.backgroundImage = 'Invalid background image URL';
  }

  // Validate social links
  if (branding.socialLinks) {
    if (branding.socialLinks.website && !isValidUrl(branding.socialLinks.website)) {
      errors['socialLinks.website'] = 'Invalid website URL';
    }
    if (branding.socialLinks.linkedin && !isValidUrl(branding.socialLinks.linkedin)) {
      errors['socialLinks.linkedin'] = 'Invalid LinkedIn URL';
    }
    if (branding.socialLinks.twitter && !isValidUrl(branding.socialLinks.twitter)) {
      errors['socialLinks.twitter'] = 'Invalid Twitter URL';
    }
    if (branding.socialLinks.facebook && !isValidUrl(branding.socialLinks.facebook)) {
      errors['socialLinks.facebook'] = 'Invalid Facebook URL';
    }
  }

  // Validate font family
  if (branding.fontFamily) {
    const validFonts = ['inter', 'poppins', 'roboto', 'montserrat', 'system'];
    if (!validFonts.includes(branding.fontFamily)) {
      errors.fontFamily = `Invalid font family. Must be one of: ${validFonts.join(', ')}`;
    }
  }

  // Validate text fields
  if (branding.companyName && branding.companyName.length > 100) {
    errors.companyName = 'Company name must be 100 characters or less';
  }

  if (branding.tagline && branding.tagline.length > 200) {
    errors.tagline = 'Tagline must be 200 characters or less';
  }

  if (branding.welcomeMessage && branding.welcomeMessage.length > 500) {
    errors.welcomeMessage = 'Welcome message must be 500 characters or less';
  }

  if (branding.footerText && branding.footerText.length > 300) {
    errors.footerText = 'Footer text must be 300 characters or less';
  }

  // Enforce plan restrictions
  if (plan !== 'enterprise') {
    if (branding.customCSS) {
      errors.customCSS = 'Custom CSS requires an Enterprise plan. Please upgrade to use this feature.';
    }
    if (branding.whiteLabel) {
      errors.whiteLabel = 'White label mode requires an Enterprise plan. Please upgrade to use this feature.';
    }
  }

  // Validate custom CSS if provided and allowed
  if (branding.customCSS && plan === 'enterprise') {
    const cssValidation = validateCSS(branding.customCSS);
    if (!cssValidation.valid) {
      errors.customCSS = cssValidation.errors.join('; ');
    }

    // Check CSS length
    if (branding.customCSS.length > 50000) {
      errors.customCSS = 'Custom CSS must be 50,000 characters or less';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate color format (hex, rgb, rgba, hsl, hsla)
 */
function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const patterns = [
    // Hex colors: #RGB or #RRGGBB
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    // RGB: rgb(r, g, b)
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
    // RGBA: rgba(r, g, b, a)
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/,
    // HSL: hsl(h, s%, l%)
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/,
    // HSLA: hsla(h, s%, l%, a)
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/,
  ];

  return patterns.some(pattern => pattern.test(color));
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate image file
 */
export interface ImageValidationOptions {
  maxSizeMB: number;
  allowedFormats: string[];
  requiredDimensions?: { width: number; height: number };
}

export function validateImageFile(
  file: File,
  options: ImageValidationOptions
): { valid: boolean; error?: string } {
  // Check file size
  const maxSizeBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${options.maxSizeMB}MB`
    };
  }

  // Check file format
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !options.allowedFormats.includes(fileExtension)) {
    return {
      valid: false,
      error: `File format must be one of: ${options.allowedFormats.join(', ')}`
    };
  }

  // Check MIME type
  const validMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ];

  if (!validMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid image file type'
    };
  }

  return { valid: true };
}

/**
 * Validation options for different image types
 */
export const IMAGE_VALIDATION_OPTIONS = {
  logo: {
    maxSizeMB: 5,
    allowedFormats: ['png', 'jpg', 'jpeg', 'svg', 'webp']
  },
  favicon: {
    maxSizeMB: 1,
    allowedFormats: ['png', 'ico', 'svg'],
    requiredDimensions: { width: 32, height: 32 } // or 64x64
  },
  background: {
    maxSizeMB: 10,
    allowedFormats: ['png', 'jpg', 'jpeg', 'webp']
  }
};
