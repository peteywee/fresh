import { cookies } from 'next/headers';

import 'server-only';

import { adminAuth } from './firebase.admin';

export type ServerSession = {
  sub: string; // Firebase user ID
  email?: string;
  displayName?: string;
  role?: string;
  orgId?: string;
  orgName?: string;
  onboardingComplete?: boolean;
  iat?: number;
  exp?: number;
} | null;

const COOKIE = process.env.SESSION_COOKIE_NAME || '__session';

// Allow injecting a cookie jar replacement (test helper) to avoid calling Next.js dynamic API outside request scope
export async function getServerSession(jarOverride?: {
  get: (name: string) => { value: string } | undefined;
}): Promise<ServerSession> {
  try {
    const jar = jarOverride || (await cookies());
    const sessionCookie = jar.get(COOKIE)?.value;
    return verifySessionCookieValue(sessionCookie, cookie =>
      adminAuth().verifySessionCookie(cookie)
    );
  } catch (error) {
    console.warn('Session verification failed:', error);
    return null;
  }
}

// Pure helper for easier unit testing without touching Next.js runtime helpers
export async function verifySessionCookieValue(
  value: string | undefined,
  verifier: (cookie: string) => Promise<any>
): Promise<ServerSession> {
  try {
    if (!value) return null;
    const claims = await verifier(value);
    return {
      sub: claims.uid,
      email: claims.email,
      displayName: claims.name || claims.displayName,
      role: claims.role,
      orgId: claims.orgId,
      orgName: claims.orgName,
      onboardingComplete: claims.onboardingComplete,
      iat: claims.iat,
      exp: claims.exp,
    };
  } catch (err) {
    console.warn('Session verification (pure) failed:', err);
    return null;
  }
}
