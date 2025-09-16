import { NextResponse } from 'next/server';

// Expose only client-safe firebase config. Values pulled from env.
// These should correspond to NEXT_PUBLIC_ prefixed variables already used on the client.
export async function GET() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Basic validation to reduce noise
  if (!cfg.apiKey) {
    return NextResponse.json({ error: 'Firebase config unavailable' }, { status: 500 });
  }
  return NextResponse.json(cfg, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600' },
  });
}
