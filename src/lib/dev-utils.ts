/**
 * Development Utilities
 * 
 * Helper functions for testing and debugging subdomain features in development
 */

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if subdomain routing is enabled
 */
export function isSubdomainRoutingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === 'true';
}

/**
 * Get subdomain from query parameter override (for testing)
 * Usage: ?subdomain=acmecorp
 */
export function getSubdomainOverride(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('subdomain');
}

/**
 * Log subdomain debugging information
 */
export function logSubdomainDebug(data: Record<string, any>): void {
  if (!isDevelopment()) {
    return;
  }

  console.group('🔍 Subdomain Debug');
  Object.entries(data).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
}

/**
 * Get current hostname information
 */
export function getHostnameInfo(): {
  hostname: string;
  port: string | null;
  protocol: string;
  isDevelopment: boolean;
  isLocalhost: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      hostname: 'unknown',
      port: null,
      protocol: 'unknown',
      isDevelopment: isDevelopment(),
      isLocalhost: false,
    };
  }

  const { hostname, port, protocol } = window.location;

  return {
    hostname,
    port: port || null,
    protocol: protocol.replace(':', ''),
    isDevelopment: isDevelopment(),
    isLocalhost: hostname.includes('localhost'),
  };
}

/**
 * Build test subdomain URL for development
 */
export function buildTestSubdomainUrl(subdomain: string, path: string = '/'): string {
  if (isDevelopment()) {
    return `http://${subdomain}.localhost:3000${path}`;
  }

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'consularly.com';
  return `https://${subdomain}.${baseDomain}${path}`;
}

/**
 * Display subdomain debug panel (for development)
 */
export function showSubdomainDebugPanel(): void {
  if (!isDevelopment() || typeof window === 'undefined') {
    return;
  }

  const info = getHostnameInfo();
  const override = getSubdomainOverride();

  const debugInfo = {
    'Current Hostname': info.hostname,
    'Port': info.port || 'N/A',
    'Protocol': info.protocol,
    'Is Development': info.isDevelopment,
    'Is Localhost': info.isLocalhost,
    'Subdomain Override': override || 'None',
    'Routing Enabled': isSubdomainRoutingEnabled(),
  };

  logSubdomainDebug(debugInfo);
}

/**
 * Test subdomain detection
 */
export async function testSubdomainDetection(): Promise<void> {
  if (!isDevelopment()) {
    console.warn('Subdomain testing is only available in development mode');
    return;
  }

  try {
    const response = await fetch('/api/subdomain/context');
    const data = await response.json();

    console.group('🧪 Subdomain Detection Test');
    console.log('API Response:', data);
    console.log('Is Main Portal:', data.isMainPortal);
    console.log('Subdomain:', data.subdomain || 'None');
    console.log('Org ID:', data.orgId || 'None');
    console.log('Org Name:', data.orgName || 'None');
    console.groupEnd();
  } catch (error) {
    console.error('Subdomain detection test failed:', error);
  }
}

// Auto-show debug panel in development
if (isDevelopment() && typeof window !== 'undefined') {
  // Add global helper functions
  (window as any).subdomainDebug = {
    show: showSubdomainDebugPanel,
    test: testSubdomainDetection,
    info: getHostnameInfo,
    buildUrl: buildTestSubdomainUrl,
  };

  console.log('💡 Subdomain debug tools available: window.subdomainDebug');
}
