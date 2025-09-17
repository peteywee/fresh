import { type App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
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
    // 1) Prefer explicit ADC pointer
    const adc = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (adc && fs.existsSync(adc)) {
      const svc = JSON.parse(fs.readFileSync(adc, 'utf8'));
      app = initializeApp({ credential: cert(svc) });
      return app!;
    }

    // 2) Try FIREBASE_SERVICE_ACCOUNT_KEY_PATH with robust resolution
    const keyRel = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    const candidates: string[] = [];
    if (keyRel) {
      candidates.push(
        path.join(process.cwd(), keyRel),
        path.join(process.cwd(), '..', '..', keyRel),
        path.join('/', 'workspaces', 'fresh', keyRel)
      );
    }
    // 3) Common default location from repo root
    candidates.push(
      path.join(process.cwd(), 'secrets', 'firebase-admin.json'),
      path.join(process.cwd(), '..', '..', 'secrets', 'firebase-admin.json'),
      path.join('/', 'workspaces', 'fresh', 'secrets', 'firebase-admin.json')
    );

    for (const p of candidates) {
      try {
        if (p && fs.existsSync(p)) {
          const svc = JSON.parse(fs.readFileSync(p, 'utf8'));
          app = initializeApp({ credential: cert(svc) });
          return app!;
        }
      } catch {
        // try next
      }
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
