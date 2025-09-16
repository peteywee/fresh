import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifySessionCookieValue } from '../apps/web/lib/session';

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if session cookie is missing', async () => {
    const session = await verifySessionCookieValue(undefined, async () => ({}) as any);
    expect(session).toBeNull();
  });

  it('should return session data if cookie is valid', async () => {
    const fakeClaims = {
      uid: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      orgId: 'test-org',
      orgName: 'Test Org',
      onboardingComplete: true,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };
    const session = await verifySessionCookieValue('valid-cookie', async () => fakeClaims);
    expect(session).toBeDefined();
    expect(session?.sub).toBe('test-uid');
    expect(session?.email).toBe('test@example.com');
  });

  it('should handle errors during session verification gracefully', async () => {
    const session = await verifySessionCookieValue('some-cookie', async () => {
      throw new Error('verification failed');
    });
    expect(session).toBeNull();
  });
});
