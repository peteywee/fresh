import { cookies } from 'next/headers';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getServerSession } from '../apps/web/lib/session';

// Mock Firebase Admin
vi.mock('../apps/web/lib/firebase.admin', () => ({
  adminAuth: vi.fn(() => ({
    verifySessionCookie: vi.fn().mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
      role: 'member',
      orgId: 'test-org',
      orgName: 'Test Org',
      onboardingComplete: true,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    }),
  })),
}));

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if session cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const session = await getServerSession();
    expect(session).toBeNull();
  });

  it('should return session data if cookie is valid', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-cookie' }),
    } as any);

    const session = await getServerSession();
    expect(session).toBeDefined();
    expect(session?.sub).toBe('test-uid');
    expect(session?.email).toBe('test@example.com');
  });

  it('should handle errors during session verification gracefully', async () => {
    vi.mocked(cookies).mockRejectedValue(new Error('Cookie parsing failed'));

    const session = await getServerSession();
    expect(session).toBeNull();
  });
});
