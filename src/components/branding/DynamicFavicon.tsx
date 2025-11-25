"use client"

import { useEffect, useRef } from 'react'
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
  // Use ref to track current favicon URL for event listener comparison
  const currentFaviconRef = useRef<string | undefined>(faviconUrl)
  
  // Keep ref in sync with prop
  useEffect(() => {
    currentFaviconRef.current = faviconUrl
  }, [faviconUrl])

  // Handle favicon updates when prop changes
  useEffect(() => {
    if (!faviconUrl) {
      // Reset to default if no favicon provided
      resetFavicon()
    } else {
      // Update favicon with cache busting
      updateFavicon(faviconUrl)
    }
  }, [faviconUrl])

  // Listen for branding update events (separate effect to avoid cleanup issues)
  useEffect(() => {
    const cleanup = onBrandingUpdate((detail) => {
      const newFavicon = detail.branding?.favicon
      if (newFavicon && newFavicon !== currentFaviconRef.current) {
        updateFavicon(newFavicon)
        currentFaviconRef.current = newFavicon
      } else if (!newFavicon && detail.field === 'favicon') {
        // Favicon was explicitly removed
        resetFavicon()
        currentFaviconRef.current = undefined
      }
    })

    return cleanup
  }, [])

  return null
}
