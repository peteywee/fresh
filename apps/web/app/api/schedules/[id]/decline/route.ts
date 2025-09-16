import { NextRequest, NextResponse } from 'next/server';

import { randomUUID } from 'crypto';

import { adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'member');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });
  const { id } = await params;
  // Support both JSON and form submissions
  let reason: string | undefined;
  if (req.headers.get('content-type')?.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    if (typeof body.reason === 'string' && body.reason.trim()) reason = body.reason.trim();
  } else if (
    req.headers.get('content-type')?.includes('application/x-www-form-urlencoded') ||
    req.headers.get('content-type')?.includes('multipart/form-data')
  ) {
    const form = await req.formData().catch(() => undefined);
    const val = form?.get('reason');
    if (typeof val === 'string' && val.trim()) reason = val.trim();
  }
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
  // Create notification for admins/owners
  try {
    const notifRef = db.collection('orgs').doc(session.orgId).collection('notifications').doc();
    await notifRef.set({
      id: notifRef.id,
      orgId: session.orgId,
      type: 'schedule.declined',
      scheduleId: id,
      actorId: session.sub,
      createdAt: Date.now(),
      message: `Schedule ${id} was declined by ${session.displayName || session.sub}`,
      reason: reason || null,
      read: false,
    });
  } catch (e) {
    // Non-fatal; still return success
    console.error('Failed to create notification', e);
  }
  return NextResponse.json({ ok: true, reason });
}
