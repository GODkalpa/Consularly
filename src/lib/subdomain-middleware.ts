/**
 * Subdomain Middleware Utilities
 * 
 * Helper functions for subdomain detection, organization lookup,
 * and access control in Next.js middleware.
 */

import { NextRequest } from 'next/server';
import { OrganizationWithId } from '@/types/firestore';
import { subdomainCache } from './subdomain-cache';

/**
 * Get organization by subdomain from Firestore
 * Uses caching to reduce database queries
 */
export async function getOrganizationBySubdomain(
  subdomain: string
): Promise<OrganizationWithId | null> {
  // Check cache first
  const cached = subdomainCache.get(subdomain);
  if (cached) {
    // Return minimal org object from cache
    return {
      id: cached.orgId,
      name: cached.orgName,
      subdomain: cached.subdomain,
      subdomainEnabled: cached.subdomainEnabled,
    } as OrganizationWithId;
  }

  try {
    // Query Firestore directly (more reliable than HTTP call in middleware)
    const { adminDb } = await import('@/lib/firebase-admin');
    
    const orgsSnapshot = await adminDb()
      .collection('organizations')
      .where('subdomain', '==', subdomain)
      .where('subdomainEnabled', '==', true)
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      console.log(`[Subdomain Middleware] No organization found for subdomain: ${subdomain}`);
      return null;
    }

    const orgDoc = orgsSnapshot.docs[0];
    const orgData = orgDoc.data();
    
    const org: OrganizationWithId = {
      id: orgDoc.id,
      name: orgData.name,
      subdomain: orgData.subdomain,
      subdomainEnabled: orgData.subdomainEnabled,
    } as OrganizationWithId;

    // Cache the result
    subdomainCache.set(subdomain, {
      orgId: org.id,
      orgName: org.name,
      subdomain: org.subdomain || subdomain,
      subdomainEnabled: org.subdomainEnabled || false,
    });

    console.log(`[Subdomain Middleware] Found organization: ${org.name} (${org.id})`);
    return org;
  } catch (error) {
    console.error('[Subdomain Middleware] Error fetching organization:', error);
    return null;
  }
}

/**
 * Validate if user has access to organization
 * Checks user's orgId against the subdomain's orgId
 */
export async function validateUserAccessToOrg(
  userId: string,
  orgId: string,
  userRole?: string
): Promise<boolean> {
  // Platform admins can access any subdomain
  if (userRole === 'admin') {
    return true;
  }

  try {
    // Fetch user's organization from API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/subdomain/validate-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, orgId }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.hasAccess === true;
  } catch (error) {
    console.error('[Subdomain Middleware] Error validating access:', error);
    return false;
  }
}

/**
 * Extract user ID from session cookie
 */
export function getUserIdFromSession(req: NextRequest): string | null {
  // Get session cookie
  const sessionCookie = req.cookies.get('s')?.value;
  
  if (!sessionCookie || sessionCookie === '0') {
    return null;
  }

  // Get user ID from separate cookie (if exists)
  const userIdCookie = req.cookies.get('uid')?.value;
  
  return userIdCookie || null;
}

/**
 * Get user role from session cookie
 */
export function getUserRoleFromSession(req: NextRequest): string | null {
  const roleCookie = req.cookies.get('role')?.value;
  return roleCookie || null;
}

/**
 * Check if route requires authentication
 */
export function isAuthenticatedRoute(pathname: string): boolean {
  const authenticatedPrefixes = [
    '/admin',
    '/org',
    '/student/dashboard',
    '/student/interview',
    '/student/results',
    '/student/profile',
  ];

  return authenticatedPrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Check if route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/student/login',
    '/student/setup',
    '/org-not-found',
    '/access-denied',
    '/subdomain-not-configured',
    '/_next',
    '/api',
    '/favicon.ico',
  ];

  return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Log subdomain access attempt
 */
export function logSubdomainAccess(
  subdomain: string,
  orgId: string | null,
  userId: string | null,
  action: 'success' | 'not_found' | 'access_denied' | 'disabled',
  req: NextRequest
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    subdomain,
    orgId,
    userId,
    action,
    pathname: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
  };

  console.log('[Subdomain Access]', JSON.stringify(logData));

  // In production, you might want to send this to a logging service
  // or store in Firestore for analytics
}
