import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';

const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || 'fresh_flags';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const res = session
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

  // Update flags cookie with current session state
  const flags = session
    ? {
        li: true,
        ob: !!session.onboardingComplete,
      }
    : {
        li: false,
      };

  res.cookies.set(FLAGS_COOKIE, JSON.stringify(flags), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
