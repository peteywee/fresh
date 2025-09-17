import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'working',
    timestamp: new Date().toISOString(),
    env_check: {
      NODE_ENV: process.env.NODE_ENV,
      API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
    },
  });
}
