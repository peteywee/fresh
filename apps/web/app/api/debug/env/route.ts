import { NextResponse } from 'next/server';

import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  const fullKeyPath = keyPath ? join(process.cwd(), keyPath) : null;

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
      ? '***SET***'
      : 'NOT_SET',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH: keyPath,
    RESOLVED_KEY_PATH: fullKeyPath,
    KEY_FILE_EXISTS: fullKeyPath ? existsSync(fullKeyPath) : 'NO_PATH',
    PWD: process.cwd(),
    ENV_FILE_EXISTS: existsSync('.env.local') ? 'YES' : 'NO',
    ENV_FILE_PATH: require('path').resolve('.env.local'),
  };

  return NextResponse.json(envVars);
}
