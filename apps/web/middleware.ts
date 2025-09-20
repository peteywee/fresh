import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];
const API_PATHS = ['/api/session'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow session API
  if (API_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check session cookie for protected routes
  const sessionCookie = req.cookies.get(process.env.SESSION_COOKIE_NAME || '__session');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
