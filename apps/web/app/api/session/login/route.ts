import { NextRequest, NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase.admin';

const COOKIE = process.env.SESSION_COOKIE_NAME || '__session';
const DAYS = Number(process.env.SESSION_COOKIE_DAYS || 5);
const EXPIRES_MS = DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });

  console.log('[session-login] Received token for processing');
  console.log('[session-login] Token type:', typeof idToken);
  console.log('[session-login] Token length:', idToken.length);
  console.log('[session-login] Token prefix:', idToken.substring(0, 100));
  console.log('[session-login] Token contains dots:', (idToken.match(/\./g) || []).length);

  try {
    console.log('[session-login] creating session cookie for token');
    const auth = adminAuth();

    // Verify the token first to get better error details
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('[session-login] token verified for user:', decodedToken.uid, decodedToken.email);

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_MS });
    console.log('[session-login] session cookie created successfully');

    const res = NextResponse.json({ success: true });
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

    // Return more specific error information
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
