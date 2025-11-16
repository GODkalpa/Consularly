'use client';

/**
 * Branding Provider Component
 * 
 * Provides organization branding context to all child components.
 * Handles fetching, caching, and state management for branding data.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { OrganizationBranding } from '@/types/firestore';
import { brandingCache } from '@/lib/branding/branding-cache';

interface BrandingContextValue {
  branding: OrganizationBranding | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  orgId?: string;
  initialBranding?: OrganizationBranding;
}

/**
 * Default branding to use as fallback
 */
const DEFAULT_BRANDING: OrganizationBranding = {
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  fontFamily: 'inter',
};

export function BrandingProvider({ 
  children, 
  orgId, 
  initialBranding 
}: BrandingProviderProps) {
  const [branding, setBranding] = useState<OrganizationBranding | null>(
    initialBranding || null
  );
  const [loading, setLoading] = useState(!initialBranding);
  const [error, setError] = useState<Error | null>(null);

  const fetchBranding = async () => {
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
    } catch (err) {
      console.error('Failed to load branding:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Use default branding on error
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (orgId) {
      brandingCache.invalidate(orgId);
    }
    await fetchBranding();
  };

  // Fetch branding when orgId changes
  useEffect(() => {
    if (!initialBranding) {
      fetchBranding();
    }
  }, [orgId]);

  // Memoize context value for performance
  const contextValue = useMemo(
    () => ({
      branding,
      loading,
      error,
      refresh,
    }),
    [branding, loading, error]
  );

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding context
 * Must be used within a BrandingProvider
 */
export function useBrandingContext(): BrandingContextValue {
  const context = useContext(BrandingContext);
  
  if (context === undefined) {
    throw new Error('useBrandingContext must be used within a BrandingProvider');
  }
  
  return context;
}
