import { NextRequest, NextResponse } from 'next/server';

import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

// Simple in-memory store for demo purposes only
const projects: { id: string; name: string }[] = [];

export async function GET() {
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const authErr = ensureRole(session, 'admin');
  if (authErr) return NextResponse.json({ error: authErr.error }, { status: authErr.status });

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const id = `proj_${Date.now()}`;
  projects.push({ id, name });
  return NextResponse.json({ ok: true, id, name }, { status: 201 });
}
