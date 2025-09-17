import * as bcrypt from 'bcryptjs';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';

type Role = 'owner' | 'admin' | 'member' | 'staff' | 'viewer';

type UserRecord = {
  id: string;
  email: string;
  password: string; // stored as bcrypt hash
  displayName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phoneNumber?: string;
  timezone?: string;
  role: Role;
  orgId: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

type OrgRecord = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  ownerId: string;
  createdAt: string;
};

type InviteRecord = {
  id: string;
  orgId: string;
  email: string;
  role: Role;
  code: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
};

const invites: Map<string, InviteRecord> = new Map();

// util
const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '');
const nowIso = () => new Date().toISOString();

// Export function to seed data - will be called from index.ts after stores are initialized
export const seedData = (users: Map<string, any>, orgs: Map<string, any>) => {
  const seedEmail = norm(process.env.ADMIN_SEED_EMAIL || 'admin@fresh.com');
  const seedOrgId = randomUUID();
  const seedUserId = randomUUID();
  const demoInviteCode = 'DEMO-' + String(Math.random()).slice(2, 8);

  if (!users.has(seedEmail)) {
    // Create seed organization
    orgs.set(seedOrgId, {
      id: seedOrgId,
      name: 'Fresh Demo Org',
      displayName: 'Fresh Demo',
      website: 'https://example.org',
      industry: 'technology',
      size: '11-50',
      ownerId: seedUserId,
      createdAt: nowIso(),
    });

    // Create seed user (bcrypt-hashed)
    users.set(seedEmail, {
      id: seedUserId,
      email: seedEmail,
      password: bcrypt.hashSync(process.env.ADMIN_SEED_PASSWORD || 'demo123', 10),
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      jobTitle: 'Administrator',
      department: 'Ops',
      phoneNumber: '',
      timezone: 'UTC',
      role: 'owner',
      orgId: seedOrgId,
      onboardingComplete: true,
      createdAt: nowIso(),
    });

    // Seed invite
    invites.set(demoInviteCode, {
      id: randomUUID(),
      orgId: seedOrgId,
      email: seedEmail,
      role: 'admin',
      code: demoInviteCode,
      expiresAt: nowIso(),
    });

    console.log('Seeded demo account:');
    console.log(`  Email: ${seedEmail}`);
    console.log(`  Password: ${process.env.ADMIN_SEED_PASSWORD || 'demo123'}`);
    console.log(`  Invite Code: ${demoInviteCode}`);
  }
};

// Export function to create router - will be called from index.ts with stores
export const createAuthRouter = (users: Map<string, any>, orgs: Map<string, any>) => {
  const router = Router();

  // User registration
  router.post('/register', (req, res) => {
    const email = norm(req.body?.email);
    const password = String(req.body?.password ?? '');
    const displayName = String(req.body?.displayName ?? '');
    const firstName = String(req.body?.firstName ?? '');
    const lastName = String(req.body?.lastName ?? '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (users.has(email)) {
      return res.status(409).json({ error: 'email already registered' });
    }

    const u: UserRecord = {
      id: randomUUID(),
      email,
      password: bcrypt.hashSync(password, 10),
      displayName: displayName || `${firstName} ${lastName}`.trim() || email.split('@')[0],
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      role: 'member',
      orgId: null,
      onboardingComplete: false,
      createdAt: nowIso(),
    };

    users.set(email, u);
    return res.status(201).json({
      success: true,
      message: 'registered',
      user: {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        onboardingComplete: u.onboardingComplete,
      },
    });
  });

  // User login
  router.post('/login', (req, res) => {
    const email = norm(req.body?.email);
    const password = String(req.body?.password ?? '');
    const u = email ? users.get(email) : null;

    if (!u || !bcrypt.compareSync(password, u.password)) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const org = u.orgId ? orgs.get(u.orgId) : null;
    u.lastLoginAt = nowIso();

    return res.status(200).json({
      success: true,
      message: 'ok',
      user: {
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        onboardingComplete: u.onboardingComplete,
      },
      organization: org
        ? {
            id: org.id,
            name: org.name,
            displayName: org.displayName,
            role: u.role,
          }
        : null,
    });
  });

  // Forgot password (no-op template—client uses Firebase for resets)
  router.post('/forgot-password', (_req, res) => {
    return res
      .status(200)
      .json({ success: true, message: 'If account exists, an email will be sent.' });
  });

  // Reset password (email flows are typically handled by Firebase/Auth provider)
  router.post('/reset-password', (_req, res) => {
    return res
      .status(200)
      .json({ success: true, message: 'Password reset processed if token is valid.' });
  });

  // List invites (demo/debug)
  router.get('/invites', (_req, res) => {
    const invitesArray = Array.from(invites.values()).map(invite => ({
      id: invite.id,
      email: invite.email,
      orgId: invite.orgId,
      role: invite.role,
      code: invite.code,
      expiresAt: invite.expiresAt,
      usedAt: invite.usedAt,
      usedBy: invite.usedBy,
    }));

    return res.status(200).json({
      success: true,
      invites: invitesArray,
    });
  });

  return router;
};
