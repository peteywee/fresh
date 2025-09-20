import { NextResponse } from 'next/server';

import { ensureRole } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Protect endpoint by ensuring user has 'admin' role
  const roleCheck = ensureRole(session, 'admin');
  if (roleCheck) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const keys = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];
  const present = Object.fromEntries(keys.map(k => [k, !!process.env[k]]));
  return NextResponse.json({ present });
}
