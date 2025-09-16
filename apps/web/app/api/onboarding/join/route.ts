import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { getServerSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });

  if (!body.inviteCode) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  try {
    // Validate invite code (demo validation)
    const validCodes = ['DEMO-123456', 'JOIN-123456'];
    if (!validCodes.some(code => code.toLowerCase() === body.inviteCode.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    const auth = adminAuth();
    const db = adminDb();

    // Determine role for the first joiner
    const orgId = 'demo-org-id';
    const orgRef = db.collection('orgs').doc(orgId);
    const orgSnap = await orgRef.get();
    if (!orgSnap.exists) {
      await orgRef.set({
        name: 'Demo Organization',
        createdAt: Date.now(),
        ownerId: session.sub,
        managers: [session.sub],
        memberCount: 1,
      });
    }
    const membersSnap = await orgRef.collection('members').get();
    const isFirstJoiner = membersSnap.empty;
    const role = isFirstJoiner ? 'admin' : 'member'; // First joiner becomes manager (admin)
    await orgRef
      .collection('members')
      .doc(session.sub)
      .set({
        role,
        displayName: body.user?.displayName || session.displayName || '',
        email: session.email || '',
        joinedAt: Date.now(),
      });

    // Update user's custom claims to mark onboarding as complete
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role,
      displayName: body.user?.displayName,
      orgName: 'Demo Organization',
      orgId,
    });

    const res = NextResponse.json({
      success: true,
      message: 'Joined organization successfully',
      user: {
        id: session.sub,
        email: session.email,
        displayName: body.user?.displayName || session.displayName,
        role,
      },
      organization: {
        id: orgId,
        name: 'Demo Organization',
        role,
      },
    });

    return res;
  } catch (error) {
    console.error('Join organization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to join organization',
      },
      { status: 500 }
    );
  }
}
