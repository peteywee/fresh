import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import 'server-only';

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback to GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp();
  }

  throw new Error(
    'Firebase Admin SDK initialization failed. Please set the required environment variables.'
  );
}

export function adminAuth(): Auth {
  if (!auth) auth = getAuth(getAdminApp());
  return auth;
}

export function adminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
