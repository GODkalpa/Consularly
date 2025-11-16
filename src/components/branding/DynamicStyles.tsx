'use client';

/**
 * Dynamic Styles Component
 * 
 * Injects organization colors, fonts, and custom CSS into the page.
 * Ensures proper scoping and sanitization for security.
 */

import { useEffect } from 'react';
import { OrganizationBranding } from '@/types/firestore';
import { sanitizeCSS, minifyCSS } from '@/lib/branding/css-sanitizer';
import { getFontFamilyCSS, loadFont } from '@/lib/branding/font-loader';

interface DynamicStylesProps {
  branding: OrganizationBranding;
  scope?: string;
}

export function DynamicStyles({ 
  branding, 
  scope = 'branded-app' 
}: DynamicStylesProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Generate CSS from branding
    let css = '';

    // Add CSS variables for colors
    if (branding.primaryColor || branding.secondaryColor || branding.backgroundColor) {
      css += `.${scope} {\n`;
      
      if (branding.primaryColor) {
        css += `  --brand-primary: ${branding.primaryColor};\n`;
      }
      if (branding.secondaryColor) {
        css += `  --brand-secondary: ${branding.secondaryColor};\n`;
      }
      if (branding.backgroundColor) {
        css += `  --brand-background: ${branding.backgroundColor};\n`;
      }
      
      css += '}\n\n';
    }

    // Add font family
    if (branding.fontFamily) {
      const fontFamilyCSS = getFontFamilyCSS(branding.fontFamily);
      css += `.${scope} {\n`;
      css += `  font-family: ${fontFamilyCSS};\n`;
      css += '}\n\n';

      // Load the font
      loadFont(branding.fontFamily);
    }

    // Apply brand colors to common components
    if (branding.primaryColor) {
      css += `
/* Primary color applications */
.${scope} .btn-primary,
.${scope} button[class*="bg-primary"],
.${scope} [class*="text-primary"] {
  color: ${branding.primaryColor};
}

.${scope} .bg-primary,
.${scope} button[class*="bg-primary"]:not([class*="hover"]) {
  background-color: ${branding.primaryColor};
}

.${scope} .border-primary {
  border-color: ${branding.primaryColor};
}

.${scope} a:not([class*="btn"]) {
  color: ${branding.primaryColor};
}

.${scope} .progress-bar {
  background-color: ${branding.primaryColor};
}
`;
    }

    if (branding.secondaryColor) {
      css += `
/* Secondary color applications */
.${scope} .btn-secondary,
.${scope} [class*="text-secondary"] {
  color: ${branding.secondaryColor};
}

.${scope} .bg-secondary {
  background-color: ${branding.secondaryColor};
}

.${scope} .border-secondary {
  border-color: ${branding.secondaryColor};
}

.${scope} .accent {
  color: ${branding.secondaryColor};
}
`;
    }

    // Add custom CSS if provided (sanitize and scope it)
    if (branding.customCSS) {
      const sanitized = sanitizeCSS(branding.customCSS, scope);
      const minified = minifyCSS(sanitized);
      css += '\n/* Custom CSS */\n';
      css += minified;
    }

    // Create or update style element
    const styleId = `branding-styles-${scope}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.type = 'text/css';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;

    // Cleanup function
    return () => {
      // Don't remove the style element on unmount to prevent flickering
      // It will be updated if branding changes
    };
  }, [branding, scope]);

  // This component doesn't render anything
  return null;
}
