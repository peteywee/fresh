import { type NextRequest, NextResponse } from 'next/server';

import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

// GET /api/admin/users — placeholder admin-only endpoint
export async function GET(_req: NextRequest) {
  const session = await getServerSession();
  try {
    ensureRole(session, 'owner');
  } catch (e) {
  return NextResponse.json({ error: 'forbidden', code: 'api/admin-users/forbidden' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, users: [] });
}
