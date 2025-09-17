'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing ${name} (check apps/web/.env.local)`);
  return v;
}

const config = {
  apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: required(
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  ),
  projectId: required(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ),
  storageBucket: required(
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: required(
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: required('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(config);
} else {
  app = getApps()[0]!;
}

export const auth = getAuth(app);
export { app };