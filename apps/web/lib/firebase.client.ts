'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

// For client-side, environment variables should be available via process.env
// If process is not defined, we're in a problematic state, so use fallbacks
const safeEnv =
  typeof process !== 'undefined' && process.env
    ? process.env
    : ({} as Record<string, string | undefined>);

const firebaseConfig = {
  apiKey: safeEnv.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: safeEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: safeEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: safeEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: safeEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: safeEnv.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Log configuration status for debugging
if (typeof window !== 'undefined') {
  console.log('Firebase config loaded:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    processAvailable: typeof process !== 'undefined',
  });
}

// Initialize Firebase app
let app: FirebaseApp;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw error;
}

// Export auth for compatibility with existing code
export const auth = getAuth(app);
export { app };