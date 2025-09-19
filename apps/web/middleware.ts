import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// For development/MVP, let all requests through and handle auth on client-side
export function middleware(req: NextRequest) {
  // Allow all requests for now - client-side auth handles redirects
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
};
