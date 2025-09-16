import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'server-only';

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  try {
    // Try to load from service account key file first
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (keyPath) {
      const fullPath = join(process.cwd(), keyPath);
      const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      return app!;
    }

    // Fallback to individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error(
        'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY in .env.local'
      );
    }
    // Keep raw newlines compatibility
    const privateKey = rawKey.replace(/\\n/g, '\n');

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return app!;
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw error;
  }
}

export function adminAuth(): Auth {
  if (!auth) auth = getAuth(getAdminApp());
  return auth;
}

export function adminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
