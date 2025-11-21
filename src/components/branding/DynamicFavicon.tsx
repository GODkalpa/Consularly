"use client"

import { useEffect } from 'react'

interface DynamicFaviconProps {
  faviconUrl?: string
}

/**
 * Client component that dynamically updates the favicon
 * based on organization branding
 */
export function DynamicFavicon({ faviconUrl }: DynamicFaviconProps) {
  useEffect(() => {
    if (!faviconUrl) return

    // Find existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]')
    
    // Remove existing favicon links
    existingLinks.forEach(link => link.remove())

    // Create new favicon link
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/x-icon'
    link.href = faviconUrl
    
    // Append to head
    document.head.appendChild(link)

    // Also create apple-touch-icon for better mobile support
    const appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    appleLink.href = faviconUrl
    document.head.appendChild(appleLink)

    // Cleanup function
    return () => {
      link.remove()
      appleLink.remove()
    }
  }, [faviconUrl])

  return null
}
