import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase.admin";

export type ServerSession =
  | (import("firebase-admin/auth").DecodedIdToken & {
      onboardingComplete?: boolean;
      role?: string;
    })
  | null;

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";

export async function getServerSession(): Promise<ServerSession> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(token, true);
    return decoded as ServerSession;
  } catch {
    return null;
  }
}
