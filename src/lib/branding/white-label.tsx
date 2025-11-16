/**
 * White Label Utility
 * 
 * Utilities for managing white label mode and conditionally showing/hiding
 * platform branding based on organization settings.
 */

import { OrganizationBranding } from '@/types/firestore';

/**
 * Check if platform branding should be shown
 * Returns false if white label mode is enabled
 */
export function shouldShowPlatformBranding(branding?: OrganizationBranding): boolean {
  return !branding?.whiteLabel;
}

/**
 * Check if platform branding is hidden (white label mode enabled)
 */
export function isPlatformBrandingHidden(branding?: OrganizationBranding): boolean {
  return branding?.whiteLabel === true;
}

/**
 * Check if white label mode is enabled
 */
export function isWhiteLabelEnabled(branding?: OrganizationBranding): boolean {
  return branding?.whiteLabel === true;
}

/**
 * Component wrapper for conditionally rendering platform branding
 * Only renders children if white label mode is NOT enabled
 */
interface PlatformBrandingProps {
  branding?: OrganizationBranding;
  children: React.ReactNode;
}

export function PlatformBranding({ branding, children }: PlatformBrandingProps) {
  if (isPlatformBrandingHidden(branding)) {
    return null;
  }
  return <>{children}</>;
}

/**
 * Component wrapper for conditionally rendering organization branding
 * Only renders children if white label mode IS enabled
 */
interface WhiteLabelContentProps {
  branding?: OrganizationBranding;
  children: React.ReactNode;
}

export function WhiteLabelContent({ branding, children }: WhiteLabelContentProps) {
  if (!isWhiteLabelEnabled(branding)) {
    return null;
  }
  return <>{children}</>;
}
