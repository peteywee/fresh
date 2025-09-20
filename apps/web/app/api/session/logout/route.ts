import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE = process.env.SESSION_COOKIE_NAME || '__session';

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url));

  // Clear session cookie
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return res;
}
