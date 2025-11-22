import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { extractSubdomain, isMainPortal, isReservedSubdomain } from '@/lib/subdomain-utils'
import {
  getOrganizationBySubdomain,
  getUserIdFromSession,
  getUserRoleFromSession,
  validateUserAccessToOrg,
  isAuthenticatedRoute,
  isPublicRoute,
  logSubdomainAccess
} from '@/lib/subdomain-middleware'

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl
    const hostname = req.headers.get('host') || ''

    // Skip middleware for static files and ALL API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api/')
    ) {
      return NextResponse.next()
    }

    // Check if subdomain routing is enabled
    const subdomainRoutingEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === 'true'

    // Extract subdomain from hostname
    const subdomain = extractSubdomain(hostname)
    const isMain = isMainPortal(hostname)

    console.log(`[Middleware] Hostname: ${hostname}, Subdomain: ${subdomain}, IsMainPortal: ${isMain}, SubdomainRouting: ${subdomainRoutingEnabled}, Path: ${pathname}`)

    // Handle subdomain routing if enabled
    if (subdomainRoutingEnabled && subdomain && !isMain) {
      console.log(`[Middleware] Processing subdomain: ${subdomain}`)

      try {
        // Check if subdomain is reserved
        if (isReservedSubdomain(subdomain)) {
          console.log(`[Middleware] Reserved subdomain: ${subdomain}`)
          return NextResponse.next() // Let it 404 naturally
        }

        // Lookup organization by subdomain
        const org = await getOrganizationBySubdomain(subdomain)

        if (!org) {
          console.log(`[Middleware] Organization not found for subdomain: ${subdomain}`)
          logSubdomainAccess(subdomain, null, null, 'not_found', req)

          // Rewrite to a 404 page instead of returning response directly
          const url = req.nextUrl.clone()
          url.pathname = '/org-not-found'
          url.searchParams.set('subdomain', subdomain)
          return NextResponse.rewrite(url)
        }

        // Check if subdomain is enabled
        if (!org.subdomainEnabled) {
          console.log(`[Middleware] Subdomain disabled for org: ${org.id}`)
          logSubdomainAccess(subdomain, org.id, null, 'disabled', req)

          const url = req.nextUrl.clone()
          url.pathname = '/subdomain-not-configured'
          return NextResponse.redirect(url)
        }

        // Set organization context headers
        const response = NextResponse.next()
        response.headers.set('x-org-id', org.id)
        response.headers.set('x-subdomain', subdomain)
        response.headers.set('x-org-name', org.name)

        // Validate user access for ALL routes (not just authenticated ones)
        const userId = getUserIdFromSession(req)
        const userRole = getUserRoleFromSession(req)

        // If user is logged in, validate they belong to this org
        if (userId) {
          const hasAccess = await validateUserAccessToOrg(userId, org.id, userRole || undefined)

          if (!hasAccess) {
            console.log(`[Middleware] Access denied for user ${userId} to org ${org.id}`)
            logSubdomainAccess(subdomain, org.id, userId, 'access_denied', req)

            // Redirect to access denied page with cleared cookies
            const url = req.nextUrl.clone()
            url.pathname = '/access-denied'
            url.searchParams.set('reason', 'org_mismatch')
            url.searchParams.set('subdomain', subdomain)

            const response = NextResponse.redirect(url)

            // Clear all session cookies
            const cookieOptions = {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              maxAge: 0,
              path: '/',
            }

            response.cookies.set('s', '0', cookieOptions)
            response.cookies.set('uid', '', cookieOptions)
            response.cookies.set('role', '', cookieOptions)
            response.cookies.set('orgId', '', cookieOptions)

            return response
          }
        }

        // For authenticated routes, require login
        if (isAuthenticatedRoute(pathname) && !userId) {
          console.log(`[Middleware] Authentication required for ${pathname}`)
          const url = req.nextUrl.clone()
          url.pathname = '/signin'
          url.searchParams.set('next', pathname)
          url.searchParams.set('subdomain', subdomain)
          return NextResponse.redirect(url)
        }

        logSubdomainAccess(subdomain, org.id, getUserIdFromSession(req), 'success', req)
        return response
      } catch (subdomainError) {
        console.error('[Middleware] Subdomain processing error:', subdomainError)
        // On error, allow the request to continue to prevent breaking the entire app
        // This ensures the app remains accessible even if subdomain features fail
        return NextResponse.next()
      }
    }

    // Original authentication logic for main portal
    // Handle admin and org routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/org')) {
      const sessionFlag = req.cookies.get('s')?.value
      console.log(`[Middleware] ${pathname} - Session cookie:`, sessionFlag)
      // Redirect if cookie is missing or explicitly set to '0'
      if (!sessionFlag || sessionFlag === '0') {
        console.log(`[Middleware] Redirecting ${pathname} to /signin (no valid session)`)
        const url = req.nextUrl.clone()
        url.pathname = '/signin'
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
      }
    }

    // Handle student routes
    if (pathname.startsWith('/student')) {
      // Allow public student routes
      const publicStudentRoutes = ['/student/login', '/student/setup']
      const isPublicRoute = publicStudentRoutes.some(route => pathname.startsWith(route))

      if (!isPublicRoute) {
        // Protected student routes - check if user is authenticated
        const sessionFlag = req.cookies.get('s')?.value
        console.log(`[Middleware] ${pathname} - Session cookie:`, sessionFlag)
        // Redirect if cookie is missing or explicitly set to '0'
        if (!sessionFlag || sessionFlag === '0') {
          console.log(`[Middleware] Redirecting ${pathname} to /student/login (no valid session)`)
          const url = req.nextUrl.clone()
          url.pathname = '/student/login'
          url.searchParams.set('returnUrl', pathname)
          return NextResponse.redirect(url)
        }
        console.log(`[Middleware] Allowing access to ${pathname} (valid session)`)
      }
    }

    return NextResponse.next()
  } catch (error) {
    // Catch-all error handler to prevent middleware from breaking the entire app
    console.error('[Middleware] Critical error:', error)
    // Allow the request to continue even if middleware fails
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
