import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  // Only management (admin+) can change roles
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error, code: 'api/team-roles/guard-error' }, { status: guard.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON', code: 'api/team-roles/bad-json' }, { status: 400 });
  const { userId, role } = body as { userId?: string; role?: string };
  if (!userId || !role || !['admin', 'member', 'staff', 'viewer'].includes(role)) {
  return NextResponse.json({ error: 'Invalid payload', code: 'api/team-roles/invalid-payload' }, { status: 400 });
  }

  if (!session?.orgId) return NextResponse.json({ error: 'No organization', code: 'api/team-roles/no-org' }, { status: 400 });

  const db = adminDb();
  await db
    .collection('orgs')
    .doc(session.orgId)
    .collection('members')
    .doc(userId)
    .set({ role }, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: 'Unauthorized', code: 'api/team-roles/unauthorized' }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ members: [] });
  const db = adminDb();
  const snap = await db.collection('orgs').doc(session.orgId).collection('members').get();
  const members = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ members });
}
