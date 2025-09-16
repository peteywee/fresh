import { type NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for static assets and API routes (ultra fast)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public routes that don't need auth
  const PUBLIC_ROUTES = new Set(['/login', '/register', '/forgot-password', '/reset-password']);
  
  // Check for session cookie (fast synchronous check)
  const hasSession = !!req.cookies.get(process.env.SESSION_COOKIE_NAME || '__session')?.value;

  // Root path: redirect based on session
  if (pathname === '/') {
    return hasSession 
      ? NextResponse.redirect(new URL('/dashboard', req.url))
      : NextResponse.next();
  }

  // Public routes: redirect if already logged in
  if (PUBLIC_ROUTES.has(pathname)) {
    return hasSession 
      ? NextResponse.redirect(new URL('/dashboard', req.url))
      : NextResponse.next();
  }

  // Onboarding: require session
  if (pathname.startsWith('/onboarding')) {
    return hasSession 
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/login', req.url));
  }

  // All other routes: require session (dashboard, team, etc.)
  return hasSession 
    ? NextResponse.next()
    : NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: [
    // Ultra-optimized matcher: only run on actual pages, skip everything else
    '/((?!_next|api|favicon|manifest|sw|icons|.*\\.).*)' 
  ],
};
