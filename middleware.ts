import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Handle admin and org routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/org')) {
    const sessionFlag = req.cookies.get('s')?.value
    if (!sessionFlag || sessionFlag === '0') {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Handle student routes
  if (pathname.startsWith('/student')) {
    const publicStudentRoutes = ['/student/login', '/student/setup']
    const isPublicRoute = publicStudentRoutes.some(route => pathname.startsWith(route))

    if (!isPublicRoute) {
      const sessionFlag = req.cookies.get('s')?.value
      if (!sessionFlag || sessionFlag === '0') {
        const url = req.nextUrl.clone()
        url.pathname = '/student/login'
        url.searchParams.set('returnUrl', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
