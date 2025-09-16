import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'member'); // allow member or above to confirm
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { id } = await params;
  const db = adminDb();
  const docRef = db.collection('orgs').doc(session.orgId).collection('schedules').doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

  await docRef.update({
    confirmed: true,
    confirmedAt: Date.now(),
    confirmedBy: session.sub,
    declined: false,
    declineReason: null,
    updatedAt: Date.now(),
    updatedBy: session.sub,
  });
  return NextResponse.json({ ok: true });
}
