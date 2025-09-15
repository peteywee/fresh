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

declare global {
  const vi: typeof import('vitest').vi;
}
