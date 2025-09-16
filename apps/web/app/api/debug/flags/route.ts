import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      session: session,
      isAuthenticated: !!session?.sub,
      onboardingComplete: !!session?.onboardingComplete,
      role: session?.role || null,
      displayName: session?.displayName || null,
      email: session?.email || null,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}