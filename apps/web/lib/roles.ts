import { type ServerSession } from "./session";

export type Role = "owner" | "admin" | "member";

const RANK: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function getRole(session: ServerSession): Role | null {
  const r = (session?.role as string | undefined)?.toLowerCase();
  if (r === "owner" || r === "admin" || r === "member") return r;
  return null;
}

export function hasRoleAtLeast(session: ServerSession, required: Role): boolean {
  const r = getRole(session);
  if (!r) return false;
  return RANK[r] >= RANK[required];
}

/**
 * Convenience helper for API route handlers.
 * Returns an error object if unauthorized, else undefined to continue.
 */
export function ensureRole(session: ServerSession, required: Role): { status: number; error: string } | undefined {
  if (!session?.sub) return { status: 401, error: "Unauthorized" };
  if (!hasRoleAtLeast(session, required)) return { status: 403, error: "Forbidden" };
}

/**
 * Convenience: management is owner or admin. Staff is member.
 */
export function isManagement(session: ServerSession): boolean {
  return hasRoleAtLeast(session, "admin");
}

/**
 * Write access is limited to management by default.
 */
export function canWrite(session: ServerSession): boolean {
  return isManagement(session);
}

/**
 * Strict guard that returns a standardized error tuple for write endpoints.
 */
export function ensureWrite(session: ServerSession): { status: number; error: string } | undefined {
  return ensureRole(session, "admin");
}
