import { NextResponse } from 'next/server';

import { adminAuth, adminDb, getAdminApp } from '../../../lib/firebase.admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const app = getAdminApp();
    // Simple lightweight checks
    const auth = adminAuth();
    const db = adminDb();

    // Fetch minimal metadata (no heavy queries)
    const projectId = app.options.projectId;

    return NextResponse.json({ ok: true, projectId, auth: !!auth, db: !!db });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Admin init failed' },
      { status: 500 }
    );
  }
}
