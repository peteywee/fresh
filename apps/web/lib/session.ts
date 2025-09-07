import "server-only";

export type Session = {
  loggedIn: boolean;
  onboarded: boolean;
  displayName?: string;
  orgName?: string;
} | null;

export async function getSession(): Promise<Session> {
  // Next 15 App Router: use headers() rather than cookies() on the server to avoid edge/runtime quirks
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const raw = jar.get("__session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
