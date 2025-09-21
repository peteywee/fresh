import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad JSON', code: 'api/register/bad-json' }, { status: 400 });

  const r = await fetch('http://localhost:3333/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
  return NextResponse.json({ error: 'API failed', code: 'api/register/api-failed', details: e }, { status: 502 });
  }
  return NextResponse.json(await r.json());
}
