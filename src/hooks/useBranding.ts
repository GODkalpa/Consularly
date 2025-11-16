'use client';

/**
 * useBranding Hook
 * 
 * Custom hook for accessing organization branding throughout the application.
 * Provides automatic fetching, caching, and helper methods.
 */

import { useEffect, useState, useCallback } from 'react';
import { OrganizationBranding } from '@/types/firestore';
import { brandingCache } from '@/lib/branding/branding-cache';
import { loadFont, getFontFamilyCSS } from '@/lib/branding/font-loader';

export interface BrandingHookResult {
  branding: OrganizationBranding | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  applyBranding: (element: HTMLElement) => void;
  getFontFamily: () => string;
}

/**
 * Default branding to use as fallback
 */
const DEFAULT_BRANDING: OrganizationBranding = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  fontFamily: 'inter',
};

/**
 * Hook to fetch and manage organization branding
 */
export function useBranding(orgId?: string): BrandingHookResult {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranding = useCallback(async () => {
    if (!orgId) {
      setBranding(DEFAULT_BRANDING);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = brandingCache.get(orgId);
      if (cached) {
        setBranding(cached);
        setLoading(false);
        
        // Load font if specified
        if (cached.fontFamily) {
          loadFont(cached.fontFamily);
        }
        
        return;
      }

      // Fetch from API
      const response = await fetch(`/api/org/branding?orgId=${orgId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch branding: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedBranding = data.branding || DEFAULT_BRANDING;

      // Cache the result
      brandingCache.set(orgId, fetchedBranding);
      
      setBranding(fetchedBranding);
      
      // Load font if specified
      if (fetchedBranding.fontFamily) {
        loadFont(fetchedBranding.fontFamily);
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      
      // Use default branding on error
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const refresh = useCallback(async () => {
    if (orgId) {
      brandingCache.invalidate(orgId);
    }
    await fetchBranding();
  }, [orgId, fetchBranding]);

  const applyBranding = useCallback((element: HTMLElement) => {
    if (!branding) return;

    // Apply colors as CSS variables
    if (branding.primaryColor) {
      element.style.setProperty('--brand-primary', branding.primaryColor);
    }
    if (branding.secondaryColor) {
      element.style.setProperty('--brand-secondary', branding.secondaryColor);
    }
    if (branding.backgroundColor) {
      element.style.setProperty('--brand-background', branding.backgroundColor);
    }

    // Apply font family
    if (branding.fontFamily) {
      element.style.fontFamily = getFontFamilyCSS(branding.fontFamily);
    }
  }, [branding]);

  const getFontFamily = useCallback(() => {
    if (!branding?.fontFamily) {
      return getFontFamilyCSS('inter');
    }
    return getFontFamilyCSS(branding.fontFamily);
  }, [branding]);

  // Fetch branding on mount or when orgId changes
  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  return {
    branding,
    loading,
    error,
    refresh,
    applyBranding,
    getFontFamily,
  };
}

/**
 * Hook to get branding colors
 */
export function useBrandingColors(orgId?: string) {
  const { branding, loading } = useBranding(orgId);

  return {
    primaryColor: branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
    secondaryColor: branding?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    backgroundColor: branding?.backgroundColor || DEFAULT_BRANDING.backgroundColor,
    loading,
  };
}

/**
 * Hook to get branding logo
 */
export function useBrandingLogo(orgId?: string) {
  const { branding, loading } = useBranding(orgId);

  return {
    logoUrl: branding?.logoUrl,
    logoLight: branding?.logoLight,
    logoDark: branding?.logoDark,
    companyName: branding?.companyName,
    loading,
  };
}
