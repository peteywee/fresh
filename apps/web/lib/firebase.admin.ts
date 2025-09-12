import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

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
    const projectId = required("FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID);
    const clientEmail = required("FIREBASE_CLIENT_EMAIL", process.env.FIREBASE_CLIENT_EMAIL);
    const rawKey = required("FIREBASE_PRIVATE_KEY", process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = rawKey.replace(/\\n/g, "\n");

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return app!;
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
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
