import crypto from 'crypto';

import { adminAuth, adminDb } from './firebase.admin';

export interface InviteTokenPayload {
  orgId: string;
  email: string;
  role: string;
  exp: number; // epoch ms expiry
  nonce: string; // randomness to prevent guessing
}

// Simple HMAC-based token (not JWT) to avoid extra deps.
const SECRET = process.env.INVITE_TOKEN_SECRET || 'dev-invite-secret-change-me';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function generateInviteToken(
  orgId: string,
  email: string,
  role: string,
  ttlMs = DEFAULT_TTL_MS
) {
  const canonical = `${orgId}|${email.toLowerCase()}|${role}`;
  const integrity = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 32);
  const payload: InviteTokenPayload & { integrity: string } = {
    orgId,
    email: email.toLowerCase(),
    role,
    exp: Date.now() + ttlMs,
    nonce: crypto.randomBytes(16).toString('hex'),
    integrity,
  };
  const json = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
  const token = Buffer.from(json).toString('base64url') + '.' + hmac;
  return { token, payload };
}

export function verifyInviteToken(token: string): InviteTokenPayload | null {
  const [b64, sig] = token.split('.');
  if (!b64 || !sig) return null;
  try {
    const json = Buffer.from(b64, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
    if (expected !== sig) return null;
    const payload = JSON.parse(json) as InviteTokenPayload;
    if (Date.now() > payload.exp) return null;
    // Recalculate integrity
    const canonical = `${payload.orgId}|${payload.email}|${payload.role}`;
    const expectedIntegrity = crypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex')
      .slice(0, 32);
    if ((payload as any).integrity !== expectedIntegrity) return null;
    return payload as InviteTokenPayload;
  } catch {
    return null;
  }
}

// Migrate a pending member doc (pending:email) to an active UID after user registers/authenticates.
export async function acceptInvite(token: string, userId: string, userEmail: string) {
  const payload = verifyInviteToken(token);
  if (!payload) throw new Error('INVALID_TOKEN');
  if (payload.email !== userEmail.toLowerCase()) throw new Error('EMAIL_MISMATCH');

  const db = adminDb();
  const auth = adminAuth();

  const pendingId = `pending:${payload.email}`;
  const memberRef = db.collection('orgs').doc(payload.orgId).collection('members').doc(pendingId);
  const snap = await memberRef.get();
  if (!snap.exists) throw new Error('INVITE_NOT_FOUND');
  const data = snap.data() || {};

  // Create active member doc under real UID
  await db
    .collection('orgs')
    .doc(payload.orgId)
    .collection('members')
    .doc(userId)
    .set(
      {
        email: payload.email,
        displayName: data.displayName || data.email?.split('@')[0] || '',
        role: payload.role,
        joinedAt: data.joinedAt || Date.now(),
        updatedAt: Date.now(),
        status: 'active',
      },
      { merge: true }
    );

  // Remove pending doc
  await memberRef.delete();

  // Update custom claims
  const user = await auth.getUser(userId);
  const claims = user.customClaims || {};
  await auth.setCustomUserClaims(userId, { ...claims, orgId: payload.orgId, role: payload.role });

  return { orgId: payload.orgId, role: payload.role };
}
