import { NextResponse } from 'next/server';

export async function GET() {
  // Test if NEXT_PUBLIC_ variables are available on the client-side
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const status = {
    configLoaded: !!clientConfig.apiKey,
    allFieldsPresent: Object.values(clientConfig).every(val => !!val),
    missingFields: Object.entries(clientConfig)
      .filter(([_, val]) => !val)
      .map(([key, _]) => key),
    projectId: clientConfig.projectId,
  };

  return NextResponse.json({
    status,
    config: status.configLoaded ? clientConfig : 'Config not loaded',
  });
}
