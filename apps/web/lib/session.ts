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

export async function getServerSession(): Promise<ServerSession> {
  try {
    const jar = await cookies();
    const sessionCookie = jar.get(COOKIE)?.value;
    if (!sessionCookie) return null;

    const auth = adminAuth();
    const claims = await auth.verifySessionCookie(sessionCookie);

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
  } catch (error) {
    console.warn('Session verification failed:', error);
    return null;
  }
}
