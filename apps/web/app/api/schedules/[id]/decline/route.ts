import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'member');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason =
    typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined;
  const db = adminDb();
  const docRef = db.collection('orgs').doc(session.orgId).collection('schedules').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  await docRef.update({
    declined: true,
    declinedAt: Date.now(),
    declinedBy: session.sub,
    declineReason: reason || null,
    confirmed: false,
    updatedAt: Date.now(),
    updatedBy: session.sub,
  });
  return NextResponse.json({ ok: true });
}
