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
  const { pathname } = req.nextUrl
  const hostname = req.headers.get('host') || ''

  // Skip middleware for static files and API routes (except subdomain APIs)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/subdomain')
  ) {
    return NextResponse.next()
  }

  // Check if subdomain routing is enabled
  const subdomainRoutingEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === 'true'

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname)
  
  console.log(`[Middleware] Hostname: ${hostname}, Subdomain: ${subdomain}, Path: ${pathname}`)

  // Handle subdomain routing if enabled
  if (subdomainRoutingEnabled && subdomain && !isMainPortal(hostname)) {
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
      
      // Return 404 for non-existent subdomains
      return new NextResponse('Organization not found', { status: 404 })
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
        
        // Clear session cookies to force re-login
        const response = new NextResponse('Access denied', { status: 403 })
        response.cookies.delete('s')
        response.cookies.delete('uid')
        response.cookies.delete('role')
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
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
