import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { ensureRole } from "@/lib/roles";
import { adminDb } from "@/lib/firebase.admin";

export async function GET() {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ schedules: [] });
  const db = adminDb();
  const snap = await db.collection("orgs").doc(session.orgId).collection("schedules").orderBy("start", "desc").limit(25).get();
  const schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const guard = ensureRole(session, "admin");
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  const db = adminDb();
  const ref = await db.collection("orgs").doc(session.orgId).collection("schedules").add({
    ...payload,
    createdBy: session.sub,
    createdAt: Date.now(),
  });
  return NextResponse.json({ ok: true, id: ref.id });
}
