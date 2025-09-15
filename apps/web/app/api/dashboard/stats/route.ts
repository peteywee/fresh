import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from '@/lib/session';

export async function GET(_req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ ok: true, stats: { projects: 0, tasks: 0 } });
}
