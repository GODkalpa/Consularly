"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { addCacheBuster } from '@/lib/favicon-utils'
import { onBrandingUpdate } from '@/lib/branding-events'

interface BrandingImageProps {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
}

/**
 * Image component that automatically handles cache busting for branding images
 * and updates when branding changes are detected
 */
export function BrandingImage({ src, alt, fill, sizes, className, priority }: BrandingImageProps) {
  const [imageSrc, setImageSrc] = useState(() => addCacheBuster(src))
  const [key, setKey] = useState(0)

  useEffect(() => {
    // Update image source with cache buster
    setImageSrc(addCacheBuster(src))
  }, [src])

  useEffect(() => {
    // Listen for branding update events
    return onBrandingUpdate((detail) => {
      const field = detail.field
      const updatedBranding = detail.branding
      
      // If logo was updated, force refresh
      if (field === 'logoUrl' && updatedBranding?.logoUrl) {
        setImageSrc(addCacheBuster(updatedBranding.logoUrl))
        setKey(prev => prev + 1) // Force re-render
      }
    })
  }, [])

  return (
    <Image
      key={key}
      src={imageSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
    />
  )
}
