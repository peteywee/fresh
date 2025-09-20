import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase.admin';

const COOKIE = process.env.SESSION_COOKIE_NAME || '__session';
const DAYS = Number(process.env.SESSION_COOKIE_DAYS || 5);
const EXPIRES_MS = DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));

  // Validate presence and basic JWT shape: xxx.yyy.zzz
  if (typeof idToken !== 'string' || idToken.split('.').length !== 3) {
    return NextResponse.json(
      { error: 'Invalid idToken (expected a JWT string with 3 segments)' },
      { status: 400 }
    );
  }

  try {
    // Verify the ID token and get user info
    const decoded = await adminAuth().verifyIdToken(idToken);

    // Exchange short-lived ID token for a long(er) lived session cookie
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: EXPIRES_MS,
    });

    const res = NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email ?? null,
      expiresAt: Date.now() + EXPIRES_MS,
    });

    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });

    return res;
  } catch (error: any) {
    console.error('[session-login] Session creation failed:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    });

    // Common "JWT" failures bubble up here:
    // - Decoding Firebase ID token failed. Make sure you passed the entire string JWT
    // - Error while making request: getaddrinfo ENOTFOUND www.googleapis.com (no network)
    // - certificate / private key malformed
    const errorCode = error?.code || 'auth/session-creation-failed';
    const errorMessage = error?.message || 'Authentication failed';

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 401 }
    );
  }
}
