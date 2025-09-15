import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  // Only management (admin+) can change roles
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });

  const { userIds, role } = body as { userIds?: string[]; role?: string };
  if (
    !userIds?.length ||
    !role ||
    !['owner', 'admin', 'member', 'staff', 'viewer'].includes(role)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const db = adminDb();
  const auth = adminAuth();
  const batch = db.batch();

  // Update Firestore memberships
  for (const userId of userIds) {
    const memberRef = db.collection('orgs').doc(session.orgId).collection('members').doc(userId);
    batch.set(memberRef, { role, updatedAt: Date.now() }, { merge: true });
  }

  await batch.commit();

  // Update custom claims for each user (Firebase Auth)
  const updatePromises = userIds.map(async userId => {
    try {
      const user = await auth.getUser(userId);
      const existingClaims = user.customClaims || {};
      await auth.setCustomUserClaims(userId, {
        ...existingClaims,
        role,
      });
    } catch (error) {
      console.warn(`Failed to update claims for user ${userId}:`, error);
    }
  });

  await Promise.allSettled(updatePromises);

  return NextResponse.json({ ok: true, updated: userIds.length });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!session.orgId) return NextResponse.json({ members: [] });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search')?.toLowerCase();

  const db = adminDb();
  let query: any = db.collection('orgs').doc(session.orgId).collection('members');

  if (role && role !== 'all') {
    query = query.where('role', '==', role);
  }

  const snap = await query.get();
  let members = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));

  // Client-side filtering for search (could be moved to Firestore with composite indexes)
  if (search) {
    members = members.filter(
      (m: any) =>
        m.displayName?.toLowerCase().includes(search) ||
        m.email?.toLowerCase().includes(search) ||
        m.id.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ members });
}
