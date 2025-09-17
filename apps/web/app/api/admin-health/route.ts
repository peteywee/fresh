import { NextResponse } from 'next/server';

import { adminAuth } from '@/lib/firebase.admin';

export async function GET() {
  try {
    const time = Date.now();
    const auth = adminAuth();
    if (!auth) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not initialized' }, { status: 500 });
    }
    // simple call to ensure Admin SDK is alive
    await auth.listUsers(1);
    return NextResponse.json({ ok: true, admin: 'connected', time });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
