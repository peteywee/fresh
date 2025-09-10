import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { ensureRole } from "@/lib/roles";

export async function GET() {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ role: session.role ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const authErr = ensureRole(session, "owner"); // Only owners can elevate/change roles
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  // In a real app, you'd update Firestore and then propagate via custom claims.
  // This endpoint is a stub to demonstrate RBAC enforcement server-side.
  const body = await req.json().catch(() => ({}));
  const { userId, role } = body || {};
  if (!userId || !["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // For demo only, we don't actually set other users' claims here.
  return NextResponse.json({ ok: true, message: "Role change accepted (stub)." });
}
