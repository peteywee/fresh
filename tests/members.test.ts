import { describe, it, expect } from 'vitest';

describe('team member route module exports', () => {
  it('exports POST handler for /api/team/members', async () => {
    const mod = await import('../apps/web/app/api/team/members/route');
    expect(typeof mod.POST).toBe('function');
  });
  it('exports PUT & DELETE handlers for /api/team/members/[id]', async () => {
    const mod = await import('../apps/web/app/api/team/members/[id]/route');
    expect(typeof mod.PUT).toBe('function');
    expect(typeof mod.DELETE).toBe('function');
  });
  it('exports POST handler for /api/team/members/accept', async () => {
    const mod = await import('../apps/web/app/api/team/members/accept/route');
    expect(typeof mod.POST).toBe('function');
  });
});

// Unit tests for invite token utility (pure functions) – does not hit Firestore.
describe('invite token utility', () => {
  it('generates and verifies a token', async () => {
    const { generateInviteToken, verifyInviteToken } = await import('../apps/web/lib/invite');
    const { token, payload } = generateInviteToken('org123', 'User@Email.Com', 'member', 1000);
    const verified = verifyInviteToken(token);
    expect(verified).toBeTruthy();
    expect(verified?.email).toBe('user@email.com');
    expect(verified?.orgId).toBe(payload.orgId);
  });
  it('rejects expired token', async () => {
    const { generateInviteToken, verifyInviteToken } = await import('../apps/web/lib/invite');
    const { token } = generateInviteToken('org123', 'test@example.com', 'member', -100); // already expired
    const verified = verifyInviteToken(token);
    expect(verified).toBeNull();
  });
  it('rejects tampered token', async () => {
    const { generateInviteToken, verifyInviteToken } = await import('../apps/web/lib/invite');
    const { token } = generateInviteToken('org123', 'test@example.com', 'member', 1000);
    const [b64, sig] = token.split('.');
    // Flip a character in the base64 payload to corrupt JSON content
    const mutatedB64 = b64.slice(0, -2) + (b64.slice(-2, -1) === 'A' ? 'B' : 'A') + b64.slice(-1);
    const tampered = mutatedB64 + '.' + sig; // Keep same signature => should fail integrity/HMAC comparison
    const verified = verifyInviteToken(tampered);
    expect(verified).toBeNull();
  });
});
