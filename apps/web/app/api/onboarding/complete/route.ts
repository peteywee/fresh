import { NextRequest, NextResponse } from 'next/server';

import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { getServerSession } from '@/lib/session';

const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || 'fresh_flags';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });

  try {
    // Create organization and membership records in Firestore
    const auth = adminAuth();
    const db = adminDb();

    const now = Date.now();
    const orgId = body.type === 'create' ? `org_${now}` : 'demo-org-id';
    const orgName = body.type === 'create' ? body.org?.name || 'Untitled Org' : 'Demo Organization';
    const role = body.type === 'create' ? 'owner' : 'member';

    if (body.type === 'create') {
      // Create org document and initial membership
      await db
        .collection('orgs')
        .doc(orgId)
        .set({
          name: orgName,
          createdAt: now,
          ownerId: session.sub,
          managers: [session.sub],
          memberCount: 1,
        });
      await db
        .collection('orgs')
        .doc(orgId)
        .collection('members')
        .doc(session.sub)
        .set({
          role: 'owner',
          displayName: body.user?.displayName || session.displayName || '',
          email: session.email || '',
          joinedAt: now,
        });
    }

    // Update user's custom claims to mark onboarding as complete
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role,
      displayName: body.user?.displayName,
      orgName,
      orgId,
    });

    const res = NextResponse.json({
      success: true,
      message: 'Onboarding completed',
      user: {
        id: session.sub,
        email: session.email,
        displayName: body.user?.displayName || session.displayName,
        role,
      },
      organization: {
        id: orgId,
        name: orgName,
        role,
      },
    });

    // Update flags cookie to reflect onboarding completion
    res.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: true, ob: true }), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      {
        error: 'Onboarding failed - make sure Firebase Authentication is enabled in console',
      },
      { status: 500 }
    );
  }
}
