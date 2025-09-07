import "server-only";
import { cookies } from "next/headers";

export type Session = {
  loggedIn: boolean;
  onboarded: boolean;
  displayName?: string;
  orgName?: string;
} | null;

// getSession is async because in some Next versions/types the cookies() helper
// can be an async function. This implementation accepts either a sync return
// value or a Promise returning the cookie jar.
export async function getSession(): Promise<Session> {
  const maybeJar = cookies();
  const jar: any = typeof (maybeJar as any)?.then === "function" ? await (maybeJar as Promise<any>) : maybeJar;

  const raw = jar.get("__session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
