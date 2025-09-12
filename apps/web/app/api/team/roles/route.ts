import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { ensureRole } from "@/lib/roles";
import { adminDb } from "@/lib/firebase.admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  // Only management (admin+) can change roles
  const guard = ensureRole(session, "admin");
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  const { userId, role } = body as { userId?: string; role?: string };
  if (!userId || !role || !["admin", "member", "staff", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!session?.orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const db = adminDb();
  await db.collection("orgs").doc(session.orgId).collection("members").doc(userId).set({ role }, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ members: [] });
  const db = adminDb();
  const snap = await db.collection("orgs").doc(session.orgId).collection("members").get();
  const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ members });
}
