/**
 * Font Loader Utility
 * 
 * Dynamically loads Google Fonts based on organization branding settings.
 * Uses font-display: swap for optimal performance.
 */

export type FontFamily = 'inter' | 'poppins' | 'roboto' | 'montserrat' | 'system';

/**
 * Map of font families to Google Fonts query strings
 */
const FONT_MAP: Record<FontFamily, string | null> = {
  inter: 'Inter:wght@400;500;600;700',
  poppins: 'Poppins:wght@400;500;600;700',
  roboto: 'Roboto:wght@400;500;700',
  montserrat: 'Montserrat:wght@400;500;600;700',
  system: null, // Use system fonts
};

/**
 * Map of font families to CSS font-family values
 */
const FONT_CSS_MAP: Record<FontFamily, string> = {
  inter: "'Inter', sans-serif",
  poppins: "'Poppins', sans-serif",
  roboto: "'Roboto', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

/**
 * Load a Google Font dynamically
 * Checks if already loaded to avoid duplicates
 */
export function loadFont(fontFamily: FontFamily): void {
  // System fonts don't need to be loaded
  if (fontFamily === 'system') {
    return;
  }

  // Check if running in browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const fontQuery = FONT_MAP[fontFamily];
  if (!fontQuery) {
    console.warn(`Unknown font family: ${fontFamily}`);
    return;
  }

  // Check if already loaded
  const existingLink = document.querySelector(
    `link[href*="${fontFamily}"]`
  );
  if (existingLink) {
    return;
  }

  // Create and inject font link
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  link.crossOrigin = 'anonymous';
  
  // Add to document head
  document.head.appendChild(link);
}

/**
 * Get CSS font-family value for a given font
 */
export function getFontFamilyCSS(fontFamily: FontFamily): string {
  return FONT_CSS_MAP[fontFamily] || FONT_CSS_MAP.inter;
}

/**
 * Preload a font for better performance
 * Should be called before the font is actually needed
 */
export function preloadFont(fontFamily: FontFamily): void {
  if (fontFamily === 'system') {
    return;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const fontQuery = FONT_MAP[fontFamily];
  if (!fontQuery) {
    return;
  }

  // Check if already preloaded
  const existingPreload = document.querySelector(
    `link[rel="preload"][href*="${fontFamily}"]`
  );
  if (existingPreload) {
    return;
  }

  // Create preload link
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
}

/**
 * Remove a loaded font from the document
 * Useful for cleanup or switching fonts
 */
export function unloadFont(fontFamily: FontFamily): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const links = document.querySelectorAll(
    `link[href*="${fontFamily}"]`
  );
  
  links.forEach(link => {
    link.remove();
  });
}

/**
 * Get all available font families
 */
export function getAvailableFonts(): FontFamily[] {
  return Object.keys(FONT_MAP) as FontFamily[];
}

/**
 * Get font display name for UI
 */
export function getFontDisplayName(fontFamily: FontFamily): string {
  const displayNames: Record<FontFamily, string> = {
    inter: 'Inter',
    poppins: 'Poppins',
    roboto: 'Roboto',
    montserrat: 'Montserrat',
    system: 'System Default',
  };

  return displayNames[fontFamily] || fontFamily;
}
