import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getServerSession } from '@/lib/session';

// Mock Firebase Admin
vi.mock('@/lib/firebase.admin', () => ({
  adminAuth: () => ({
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
  }),
}));

describe('Session Management', () => {
  it('should return null when no session cookie exists', async () => {
    // Mock cookies to return undefined
    vi.mocked(vi.importMock('next/headers')).cookies.mockReturnValue({
      get: vi.fn(() => undefined),
    });

    const session = await getServerSession();
    expect(session).toBeNull();
  });

  it('should parse valid session cookie', async () => {
    // Mock cookies to return a valid session cookie
    vi.mocked(vi.importMock('next/headers')).cookies.mockReturnValue({
      get: vi.fn(() => ({ value: 'valid-session-cookie' })),
    });

    const session = await getServerSession();
    expect(session).toEqual({
      sub: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'member',
      orgId: 'test-org',
      orgName: 'Test Org',
      onboardingComplete: true,
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it('should handle session verification errors gracefully', async () => {
    // Mock Firebase to throw an error
    vi.mocked(vi.importMock('@/lib/firebase.admin')).adminAuth.mockReturnValue({
      verifySessionCookie: vi.fn().mockRejectedValue(new Error('Invalid token')),
    });

    vi.mocked(vi.importMock('next/headers')).cookies.mockReturnValue({
      get: vi.fn(() => ({ value: 'invalid-session-cookie' })),
    });

    const session = await getServerSession();
    expect(session).toBeNull();
  });
});
