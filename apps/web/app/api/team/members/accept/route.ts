import { NextRequest, NextResponse } from 'next/server';

import { acceptInvite } from '@/lib/invite';
import { getServerSession } from '@/lib/session';

// POST /api/team/members/accept { token }
// Requires user to be authenticated (session cookie present) and email must match invite.
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub || !session.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  try {
    const { orgId, role } = await acceptInvite(body.token, session.sub, session.email);
    // Response: client should refresh session (custom claims changed)
    return NextResponse.json({ ok: true, orgId, role });
  } catch (e: any) {
    const code = e?.message || 'INVITE_ERROR';
    const statusMap: Record<string, number> = {
      INVALID_TOKEN: 400,
      EMAIL_MISMATCH: 403,
      INVITE_NOT_FOUND: 404,
    };
    return NextResponse.json({ error: code }, { status: statusMap[code] || 500 });
  }
}
