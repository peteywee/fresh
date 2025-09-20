import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Mock environment variables for tests
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
  vi.stubEnv('SESSION_COOKIE_NAME', '__test_session');
  vi.stubEnv('FLAGS_COOKIE_NAME', 'test_flags');

  // Firebase Admin SDK env (server-side) — fake but structurally valid
  vi.stubEnv('FIREBASE_PROJECT_ID', 'test-project');
  vi.stubEnv('FIREBASE_CLIENT_EMAIL', 'firebase-adminsdk@test-project.iam.gserviceaccount.com');
  // Use escaped newlines; firebase.admin.ts replaces \\n with real newlines
  vi.stubEnv(
    'FIREBASE_PRIVATE_KEY',
    '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtestkeymaterialonlyforunittests\\nNOMORETHANTHIS\n-----END PRIVATE KEY-----\n'
  );
});

afterAll(() => {
  // Cleanup after all tests
  vi.unstubAllEnvs();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  redirect: vi.fn(),
}));

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(() => ({ value: 'mock-cookie-value' })),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock server-only to prevent client component errors in tests
vi.mock('server-only', () => ({}));

// Mock Firebase Admin access to avoid real SDK init during module import in tests
vi.mock('@/lib/firebase.admin', () => {
  const verifySessionCookie = vi.fn(async () => ({ uid: 'test-uid' }));
  const adminAuth = () => ({ verifySessionCookie });
  const adminDb = () => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), update: vi.fn(), delete: vi.fn() })),
      add: vi.fn(),
      where: vi.fn(),
    })),
  });
  return { adminAuth, adminDb };
});

declare global {
  const vi: typeof import('vitest').vi;
}
