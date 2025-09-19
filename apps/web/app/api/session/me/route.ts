import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (session?.sub) {
      return NextResponse.json({
        ok: true,
        sub: session.sub,
        email: session.email,
        displayName: session.displayName,
        role: session.role,
        onboardingComplete: session.onboardingComplete,
      });
    } else {
      return NextResponse.json({
        ok: false,
        message: 'No server session found',
      });
    }
  } catch (error) {
    console.error('Session probe error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
