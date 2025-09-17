import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

function resolveKeyPath(): string {
  // Highest priority: explicit ADC
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  // Repo-root secrets/firebase-admin.json
  const repoRoot = process.cwd();
  const fromRoot = path.join(repoRoot, 'secrets', 'firebase-admin.json');
  if (fs.existsSync(fromRoot)) return fromRoot;

  // When running from apps/web/, step up to repo root
  const fromWeb = path.join(repoRoot, '..', '..', 'secrets', 'firebase-admin.json');
  if (fs.existsSync(fromWeb)) return path.resolve(fromWeb);

  throw new Error(
    'firebase-admin.json not found. Set GOOGLE_APPLICATION_CREDENTIALS or place secrets/firebase-admin.json at repo root.'
  );
}

let app: any;
let auth: any;
let db: any;

try {
  const keyPath = resolveKeyPath();
  const svc = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        credential: cert({
          projectId: svc.project_id,
          clientEmail: svc.client_email,
          privateKey: svc.private_key,
        }),
      });

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase Admin initialization skipped:', error);
  // Initialize placeholders for graceful degradation
  app = null;
  auth = null;
  db = null;
}

export const adminAuth = auth;
export const adminDb = () => db;
