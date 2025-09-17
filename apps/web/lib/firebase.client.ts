'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, GoogleAuthProvider, getAuth } from 'firebase/auth';

// Require essential NEXT_PUBLIC_* variables; fail fast in dev to avoid silent breakage
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Ensure apps/web/.env.local is populated and dev server restarted.`
    );
  }
  return value;
}

const firebaseConfig = {
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

// Initialize Firebase app
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

// Initialize Firebase Auth
export const auth = getAuth(app);
export const firebaseApp = app;

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Legacy exports for compatibility
export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}
