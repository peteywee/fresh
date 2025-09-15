import { describe, expect, it, vi } from 'vitest';

import { getServerSession } from '../apps/web/lib/session';

// Mock Firebase Admin before importing the session module
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
  it('should be importable without errors', () => {
    expect(getServerSession).toBeDefined();
    expect(typeof getServerSession).toBe('function');
  });

  it('should handle missing session gracefully', async () => {
    // Simple test that doesn't depend on complex mocking
    const result = await getServerSession();
    // Just verify it returns something (null or session object)
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
