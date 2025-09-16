import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ schedules: [] });
  const db = adminDb();
  const { searchParams } = new URL(req.url);
  const all = searchParams.has('all');
  const pending = searchParams.has('pending');

  let query = db
    .collection('orgs')
    .doc(session.orgId)
    .collection('schedules')
    .orderBy('start', 'desc')
    .limit(100);
  const snap = await query.get();
  let schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);

  if (!all) {
    if (pending) {
      schedules = schedules.filter(s => !s.confirmed && !s.declined);
    } else {
      schedules = schedules.filter(s => s.confirmed && !s.declined);
    }
  }
  return NextResponse.json({ schedules });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  const db = adminDb();
  const ref = await db
    .collection('orgs')
    .doc(session.orgId)
    .collection('schedules')
    .add({
      ...payload,
      confirmed: false,
      declined: false,
      createdBy: session.sub,
      createdAt: Date.now(),
    });
  return NextResponse.json({ ok: true, id: ref.id });
}
