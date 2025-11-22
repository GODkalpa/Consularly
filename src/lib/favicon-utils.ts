/**
 * Favicon and Image Utilities
 * Handles dynamic favicon updates and image cache busting
 */

/**
 * Updates the page favicon with cache busting to ensure browser refresh
 * @param faviconUrl - The URL of the favicon image
 */
export function updateFavicon(faviconUrl: string): void {
  if (typeof window === 'undefined') return;
  
  // Add cache-busting timestamp
  const cacheBuster = `?v=${Date.now()}`;
  const faviconUrlWithCache = faviconUrl.includes('?') 
    ? `${faviconUrl}&v=${Date.now()}`
    : faviconUrl + cacheBuster;
  
  // Find and remove existing favicon links
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());

  // Create standard favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = faviconUrlWithCache;
  document.head.appendChild(link);

  // Create shortcut icon for older browsers
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.type = 'image/x-icon';
  shortcutLink.href = faviconUrlWithCache;
  document.head.appendChild(shortcutLink);

  // Create apple-touch-icon for mobile support
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = faviconUrlWithCache;
  document.head.appendChild(appleLink);
  
  // Force refresh after a short delay (browser cache workaround)
  setTimeout(() => {
    link.href = faviconUrlWithCache;
    shortcutLink.href = faviconUrlWithCache;
    appleLink.href = faviconUrlWithCache;
  }, 100);
}

/**
 * Resets favicon to default
 */
export function resetFavicon(): void {
  if (typeof window === 'undefined') return;
  
  const existingLinks = document.querySelectorAll('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());
  
  // Add default favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/x-icon';
  link.href = '/favicon.ico';
  document.head.appendChild(link);
}

/**
 * Preload favicon to ensure it's cached
 * @param faviconUrl - The URL of the favicon to preload
 */
export function preloadFavicon(faviconUrl: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = faviconUrl;
  document.head.appendChild(link);
}

/**
 * Adds cache busting parameter to an image URL
 * @param imageUrl - The URL of the image
 * @param timestamp - Optional timestamp (defaults to current time)
 * @returns URL with cache busting parameter
 */
export function addCacheBuster(imageUrl: string, timestamp?: number): string {
  if (!imageUrl) return imageUrl;
  
  const ts = timestamp || Date.now();
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${ts}`;
}

/**
 * Removes cache busting parameter from an image URL
 * @param imageUrl - The URL with cache busting parameter
 * @returns Clean URL without cache busting
 */
export function removeCacheBuster(imageUrl: string): string {
  if (!imageUrl) return imageUrl;
  
  return imageUrl.replace(/[?&]v=\d+/, '');
}
