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
  if (!v) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.warn(`Firebase Admin: Missing env ${name} in development mode`);
      // Return a placeholder value that won't break initialization
      if (name === 'FIREBASE_PROJECT_ID') return 'demo-project';
      if (name === 'FIREBASE_CLIENT_EMAIL') return 'demo@demo-project.iam.gserviceaccount.com';
      if (name === 'FIREBASE_PRIVATE_KEY')
        return `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nDemo placeholder key for development only\n-----END PRIVATE KEY-----\n`;
    }
    throw new Error(`Missing env: ${name}`);
  }
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
    const projectId = required('FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID);
    const clientEmail = required('FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL);
    const rawKey = required('FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = rawKey.replace(/\\n/g, '\n');

    const isDev = process.env.NODE_ENV === 'development';

    // In development with demo values, create a mock app that won't connect to Firebase
    if (isDev && projectId === 'demo-project') {
      console.warn('Firebase Admin: Using development mode with placeholder credentials');
      console.warn('Firebase Admin SDK operations will not work properly');
    }

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return app!;
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.warn('Firebase Admin initialization failed in development:', error);
      console.warn('Continuing with limited functionality');
      // Create a minimal app for development
      try {
        app = initializeApp({
          projectId: 'demo-project',
        });
        return app!;
      } catch (devError) {
        console.error('Failed to create development Firebase app:', devError);
        throw devError;
      }
    }
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
