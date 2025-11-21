'use client';

/**
 * useOrgContext Hook
 * 
 * Hook for accessing organization context from subdomain
 */

import { useEffect, useState, useCallback } from 'react';
import { OrganizationBranding } from '@/types/firestore';

export interface OrgContext {
  isMainPortal: boolean;
  subdomain: string | null;
  orgId: string | null;
  orgName: string | null;
  branding: OrganizationBranding | null;
}

export interface OrgContextHookResult {
  context: OrgContext | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch organization context from subdomain
 */
export function useOrgContext(): OrgContextHookResult {
  const [context, setContext] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subdomain/context');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch context: ${response.statusText}`);
      }

      const data = await response.json();
      setContext(data);
    } catch (err) {
      console.error('Failed to load organization context:', err);
      const errorObj = err instanceof Error ? err : new Error('Unknown error');
      setError(errorObj);
      
      // Set default main portal context on error
      setContext({
        isMainPortal: true,
        subdomain: null,
        orgId: null,
        orgName: null,
        branding: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchContext();
  }, [fetchContext]);

  // Fetch context on mount
  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    context,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook to check if current page is on a subdomain
 */
export function useIsSubdomain(): boolean {
  const { context, loading } = useOrgContext();
  
  if (loading || !context) {
    return false;
  }
  
  return !context.isMainPortal && !!context.subdomain;
}

/**
 * Hook to get current subdomain
 */
export function useSubdomain(): string | null {
  const { context, loading } = useOrgContext();
  
  if (loading || !context) {
    return null;
  }
  
  return context.subdomain;
}
