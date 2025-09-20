import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import 'server-only';

let app: any = null;
let auth: any = null;
let db: any = null;
let initError: Error | null = null;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env for Admin SDK'
    );
  }

  // Handle common copy/paste: escaped \n characters
  if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');

  // Initialize Admin app once
  if (!getApps().length) {
    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase Admin initialization skipped:', error);
  initError = error instanceof Error ? error : new Error(String(error));
  // Initialize placeholders for graceful degradation
  app = null;
  auth = null;
  db = null;
}

export const adminAuth = () => {
  if (!auth) {
    throw new Error('Firebase Admin Auth not initialized', { cause: initError });
  }
  return auth;
};

export const adminDb = () => {
  if (!db) {
    throw new Error('Firebase Admin DB not initialized', { cause: initError });
  }
  return db;
};
