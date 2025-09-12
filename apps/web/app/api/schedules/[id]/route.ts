import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { ensureRole } from "@/lib/roles";
import { adminDb } from "@/lib/firebase.admin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, "admin");
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { id } = await params;

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const db = adminDb();
  const docRef = db.collection("orgs").doc(session.orgId).collection("schedules").doc(id);
  
  // Check if document exists and user has permission to edit
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  await docRef.update({
    ...payload,
    updatedBy: session.sub,
    updatedAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, "admin");
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { id } = await params;
  const db = adminDb();
  const docRef = db.collection("orgs").doc(session.orgId).collection("schedules").doc(id);
  
  // Check if document exists
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

  await docRef.delete();
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { id } = await params;
  const db = adminDb();
  const doc = await db.collection("orgs").doc(session.orgId).collection("schedules").doc(id).get();
  
  if (!doc.exists) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  
  return NextResponse.json({ id: doc.id, ...doc.data() });
}
