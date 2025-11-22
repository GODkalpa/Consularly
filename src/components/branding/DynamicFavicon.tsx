"use client"

import { useEffect } from 'react'
import { updateFavicon, resetFavicon } from '@/lib/favicon-utils'
import { onBrandingUpdate } from '@/lib/branding-events'

interface DynamicFaviconProps {
  faviconUrl?: string
}

/**
 * Client component that dynamically updates the favicon
 * based on organization branding
 * 
 * Handles browser caching and ensures reliable favicon updates
 */
export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) {
      // Reset to default if no favicon provided
      resetFavicon()
      return
    }

    // Update favicon with cache busting
    updateFavicon(faviconUrl)

    // Listen for branding update events
    return onBrandingUpdate((detail) => {
      const newFavicon = detail.branding?.favicon
      if (newFavicon && newFavicon !== faviconUrl) {
        updateFavicon(newFavicon)
      }
    })
  }, [faviconUrl])

  return null
}
