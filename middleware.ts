import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') || pathname.startsWith('/org')) {
    // SAFE DEFAULT: Only redirect if cookie explicitly indicates signed-out state.
    // Until login/logout wiring sets this cookie, allow access to proceed.
    const sessionFlag = req.cookies.get('s')?.value
    if (sessionFlag === '0') {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/org/:path*'],
}
