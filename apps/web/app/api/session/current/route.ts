import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  return session
    ? NextResponse.json(
        {
          success: true,
          loggedIn: true,
          user: {
            id: session.sub,
            email: session.email,
            displayName: session.displayName,
            role: session.role,
            orgId: session.orgId,
            orgName: session.orgName,
            onboardingComplete: session.onboardingComplete,
          },
        },
        { status: 200 }
      )
    : NextResponse.json({ success: false, loggedIn: false }, { status: 200 });
}
