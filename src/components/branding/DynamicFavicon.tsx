'use client';

/**
 * Dynamic Favicon Component
 * 
 * Injects organization favicon into page metadata.
 * Falls back to default favicon if not provided.
 */

import { useEffect } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string;
}

export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const favicon = faviconUrl || '/favicon.ico';

    // Update or create favicon link
    let faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    
    faviconLink.href = favicon;

    // Update or create apple-touch-icon
    let appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    
    appleTouchIcon.href = favicon;

    // Cleanup function
    return () => {
      // Don't remove the links on unmount, just leave them
      // This prevents flickering when navigating between pages
    };
  }, [faviconUrl]);

  // This component doesn't render anything
  return null;
}
