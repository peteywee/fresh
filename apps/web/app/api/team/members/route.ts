import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase.admin';
import { generateInviteToken } from '@/lib/invite';
import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

// POST /api/team/members  -> create/invite a member (placeholder implementation)
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const guard = ensureRole(session, 'admin');
  if (guard) return NextResponse.json({ error: guard.error }, { status: guard.status });
  if (!session?.orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  const { email, displayName, role } = body as {
    email?: string;
    displayName?: string;
    role?: string;
  };
  if (!email || !role || !['owner','admin','member','staff','viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const db = adminDb();

  // Try to find existing user by email (if already registered)
  let userId: string | null = null;
  try {
    const auth = adminAuth();
    const user = await auth.getUserByEmail(email).catch(() => null);
    if (user) {
      userId = user.uid;
      // Merge custom claims (do not override other claims)
      const existingClaims = user.customClaims || {};
      await auth.setCustomUserClaims(user.uid, { ...existingClaims, role });
    }
  } catch (e) {
    // Non-fatal; user may not exist yet (invited state)
  }

  // Create a member doc with either resolved userId or a generated placeholder id (email-based)
  const memberId = userId || `pending:${email.toLowerCase()}`;

  await db
    .collection('orgs')
    .doc(session.orgId)
    .collection('members')
    .doc(memberId)
    .set(
      {
        email: email.toLowerCase(),
        displayName: displayName || email.split('@')[0],
        role,
        joinedAt: Date.now(),
        updatedAt: Date.now(),
        status: userId ? 'active' : 'invited',
      },
      { merge: true }
    );
  let inviteToken: string | undefined;
  if (!userId) {
    const { token } = generateInviteToken(session.orgId, email, role);
    inviteToken = token;
  }

  return NextResponse.json({ ok: true, id: memberId, inviteToken });
}
