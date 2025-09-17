import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC = new Set<string>([
  '/login',
  '/register',
  '/forgot-password',
  '/_next',
  '/icons',
  '/favicon.ico',
  '/manifest.json',
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths (quick MVP; full server-side auth can be added later via cookies)
  for (const p of PUBLIC) {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      return NextResponse.next();
    }
  }
  // For MVP we don't enforce on the edge, client guard will redirect if not authed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api).*)'],
};
