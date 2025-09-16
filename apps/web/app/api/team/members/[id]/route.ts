import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

// PUT /api/team/members/:id  -> update member metadata (displayName, role)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  const { displayName, role } = body as { displayName?: string; role?: string };
  if (!displayName && !role) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }
  if (role && !['owner','admin','member','staff','viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const db = adminDb();
  const updateData: Record<string, any> = { updatedAt: Date.now() };
  if (displayName) updateData.displayName = displayName;
  if (role) updateData.role = role;

  await db
    .collection('orgs')
    .doc(session.orgId)
    .collection('members')
    .doc(id)
    .set(updateData, { merge: true });

  // Sync claims if role changed and member is an active user
  if (role && !id.startsWith('pending:')) {
    try {
      const auth = adminAuth();
      const user = await auth.getUser(id);
      const existingClaims = user.customClaims || {};
      await auth.setCustomUserClaims(id, { ...existingClaims, role });
    } catch (e) {
      // Ignore if user not found
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/team/members/:id  -> remove member from org
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const { id } = await params;
  const db = adminDb();
  await db
    .collection('orgs')
    .doc(session.orgId)
    .collection('members')
    .doc(id)
    .delete();

  return NextResponse.json({ ok: true });
}
