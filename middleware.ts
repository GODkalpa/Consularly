import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
  matcher: ['/admin/:path*', '/org/:path*', '/student/:path*'],
}
