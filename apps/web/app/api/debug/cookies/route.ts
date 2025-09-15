import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll();
  return NextResponse.json({
    cookies: cookies.map(c => ({ name: c.name, value: c.value })),
    flags: req.cookies.get('fresh_flags')?.value
      ? JSON.parse(req.cookies.get('fresh_flags')!.value)
      : null,
  });
}
