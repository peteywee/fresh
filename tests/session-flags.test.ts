import { describe, expect, it } from 'vitest';

// Simple pure parser mirroring logic in useSession (avoids DOM dependency)
function parseFlagsCookie(value: string | undefined) {
  if (!value) return null;
  try {
    const flags = JSON.parse(decodeURIComponent(value));
    return {
      isLoggedIn: !!flags.li,
      isOnboarded: !!flags.ob,
      userId: flags.uid,
      role: flags.role,
      orgId: flags.orgId,
    };
  } catch {
    return null;
  }
}

describe('session flags parsing', () => {
  it('parses valid flags', () => {
    const cookieVal = encodeURIComponent(
      JSON.stringify({ li: true, ob: true, uid: 'user1', role: 'admin', orgId: 'org1' })
    );
    const parsed = parseFlagsCookie(cookieVal);
    expect(parsed?.isLoggedIn).toBe(true);
    expect(parsed?.role).toBe('admin');
    expect(parsed?.orgId).toBe('org1');
  });

  it('returns null for invalid json', () => {
    const parsed = parseFlagsCookie('%7Bbad-json');
    expect(parsed).toBeNull();
  });
});
