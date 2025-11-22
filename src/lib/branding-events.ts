/**
 * Branding Events System
 * 
 * Custom events for real-time branding updates across the application
 */

import type { OrganizationBranding } from '@/types/firestore'

export interface BrandingUpdatedEventDetail {
  branding: Partial<OrganizationBranding>
  field?: keyof OrganizationBranding
}

/**
 * Dispatches a branding updated event
 * @param branding - The updated branding object
 * @param field - Optional specific field that was updated
 */
export function dispatchBrandingUpdate(
  branding: Partial<OrganizationBranding>,
  field?: keyof OrganizationBranding
): void {
  if (typeof window === 'undefined') return

  const event = new CustomEvent<BrandingUpdatedEventDetail>('brandingUpdated', {
    detail: { branding, field },
  })

  window.dispatchEvent(event)
}

/**
 * Adds a listener for branding update events
 * @param callback - Function to call when branding is updated
 * @returns Cleanup function to remove the listener
 */
export function onBrandingUpdate(
  callback: (detail: BrandingUpdatedEventDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BrandingUpdatedEventDetail>
    callback(customEvent.detail)
  }

  window.addEventListener('brandingUpdated', handler)

  return () => {
    window.removeEventListener('brandingUpdated', handler)
  }
}

/**
 * Hook-style listener for branding updates (use in React components)
 * @example
 * ```tsx
 * useEffect(() => {
 *   return onBrandingUpdate((detail) => {
 *     console.log('Branding updated:', detail.branding)
 *     if (detail.field === 'logoUrl') {
 *       // Handle logo update
 *     }
 *   })
 * }, [])
 * ```
 */
