import { Router } from 'express';
import { randomUUID } from 'node:crypto';

type Role = 'owner' | 'admin' | 'member' | 'staff' | 'viewer';

type UserRecord = {
  id: string;
  email: string;
  password: string; // dev-only plain text; replace with hash in prod
  displayName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phoneNumber?: string;
  timezone?: string;
  role: Role;
  orgId?: string | null;
  onboardingComplete?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
};

type OrganizationRecord = {
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
  invitedBy: string;
  email?: string;
  role: Role;
  code: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
};

const users = new Map<string, UserRecord>(); // key by normalized email
const organizations = new Map<string, OrganizationRecord>(); // key by org id
const invites = new Map<string, InviteRecord>(); // key by invite code
const resetTokens = new Map<string, string>(); // token -> normalized email

const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

// Seed data
const seedEmail = norm('admin@fresh.com');
const seedOrgId = randomUUID();
const seedUserId = randomUUID();

if (!users.has(seedEmail)) {
  // Create seed organization
  organizations.set(seedOrgId, {
    id: seedOrgId,
    name: 'Fresh Demo Organization',
    displayName: 'Fresh Demo Org',
    description: 'Demo organization for testing',
    industry: 'technology',
    size: '11-50',
    ownerId: seedUserId,
    createdAt: new Date().toISOString(),
  });

  // Create seed user
  users.set(seedEmail, {
    id: seedUserId,
    email: seedEmail,
    password: 'demo123',
    displayName: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    jobTitle: 'Administrator',
    role: 'owner',
    orgId: seedOrgId,
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
  });

  // Create demo invite code
  const demoInviteCode = 'DEMO-' + String(Math.random()).slice(2, 8).toUpperCase();
  const inviteExpiry = new Date();
  inviteExpiry.setDate(inviteExpiry.getDate() + 7); // 7 days from now

  invites.set(demoInviteCode, {
    id: randomUUID(),
    orgId: seedOrgId,
    invitedBy: seedUserId,
    role: 'member',
    code: demoInviteCode,
    expiresAt: inviteExpiry.toISOString(),
  });

  console.log(`🎯 Demo setup complete:`);
  console.log(`   Email: ${seedEmail}`);
  console.log(`   Password: demo123`);
  console.log(`   Invite Code: ${demoInviteCode}`);
}

const router = Router();

// User registration
router.post('/register', (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? '');
  const displayName = String(req.body?.displayName ?? '');
  const firstName = String(req.body?.firstName ?? '');
  const lastName = String(req.body?.lastName ?? '');

  if (!email || !password) {
  return res.status(400).json({ error: 'email and password are required', code: 'auth/email-password-required' });
  }
  if (users.has(email)) {
  return res.status(409).json({ error: 'email already registered', code: 'auth/email-already-registered' });
  }

  const u: UserRecord = {
    id: randomUUID(),
    email,
    password,
    displayName: displayName || `${firstName} ${lastName}`.trim() || email.split('@')[0],
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    role: 'member',
    orgId: null,
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
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

  if (!u || u.password !== password) {
  return res.status(401).json({ error: 'invalid credentials', code: 'auth/invalid-credentials' });
  }

  // Update last login
  u.lastLoginAt = new Date().toISOString();

  const org = u.orgId ? organizations.get(u.orgId) : null;

  return res.status(200).json({
    success: true,
    message: 'ok',
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      onboardingComplete: !!u.onboardingComplete,
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

// Forgot password
router.post('/forgot-password', (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;

  // Do not leak existence; always return 200
  if (!u) {
    return res.status(200).json({
      success: true,
      message: 'if the account exists, a reset token has been sent',
    });
  }

  const token = randomUUID();
  resetTokens.set(token, email);

  // Dev-only: return token to speed up local testing
  return res.status(200).json({
    success: true,
    message: 'reset token created',
    token, // Remove in production
  });
});

// Reset password
router.post('/reset-password', (req, res) => {
  const token = String(req.body?.token ?? '');
  const newPassword = String(req.body?.newPassword ?? '');

  if (!token || !newPassword) {
  return res.status(400).json({ error: 'token and newPassword are required', code: 'auth/token-password-required' });
  }

  const email = resetTokens.get(token);
  if (!email) {
  return res.status(400).json({ error: 'invalid or expired token', code: 'auth/invalid-expired-token' });
  }

  const u = users.get(email);
  if (!u) {
  return res.status(400).json({ error: 'invalid state', code: 'auth/invalid-state' });
  }

  u.password = newPassword;
  resetTokens.delete(token);

  return res.status(200).json({
    success: true,
    message: 'password reset successfully',
  });
});

// Complete onboarding - Create organization
router.post('/onboarding/complete', (req, res) => {
  const { user: userInfo, org: orgInfo, type = 'create' } = req.body || {};

  if (!userInfo?.displayName || !orgInfo?.name) {
  return res.status(400).json({ error: 'user displayName and org name are required', code: 'auth/displayname-org-required' });
  }

  if (type === 'create') {
    // Create new organization
    const orgId = randomUUID();
    const userId = randomUUID();
    const now = new Date().toISOString();

    const organization: OrganizationRecord = {
      id: orgId,
      name: orgInfo.name,
      displayName: orgInfo.displayName || orgInfo.name,
      description: orgInfo.description,
      website: orgInfo.website,
      industry: orgInfo.industry,
      size: orgInfo.size,
      ownerId: userId,
      createdAt: now,
    };

    organizations.set(orgId, organization);

    // Update or create user
    const email = norm(userInfo.email);
    let user = users.get(email);

    if (user) {
      // Update existing user
      user.displayName = userInfo.displayName;
      user.firstName = userInfo.firstName;
      user.lastName = userInfo.lastName;
      user.jobTitle = userInfo.jobTitle;
      user.department = userInfo.department;
      user.phoneNumber = userInfo.phoneNumber;
      user.timezone = userInfo.timezone;
      user.role = 'owner';
      user.orgId = orgId;
      user.onboardingComplete = true;
    } else {
      // Create new user
      user = {
        id: userId,
        email: email,
        password: 'temp-password', // Should be set during registration
        displayName: userInfo.displayName,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        jobTitle: userInfo.jobTitle,
        department: userInfo.department,
        phoneNumber: userInfo.phoneNumber,
        timezone: userInfo.timezone || 'UTC',
        role: 'owner',
        orgId: orgId,
        onboardingComplete: true,
        createdAt: now,
      };
      users.set(email, user);
    }

    return res.status(200).json({
      success: true,
      message: 'onboarding completed - organization created',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        displayName: organization.displayName,
        role: 'owner',
      },
    });
  } else {
  return res.status(400).json({ error: 'invalid onboarding type', code: 'auth/invalid-onboarding-type' });
  }
});

// Join organization via invite code
router.post('/onboarding/join', (req, res) => {
  const { user: userInfo, inviteCode } = req.body || {};

  if (!userInfo?.displayName || !inviteCode) {
  return res.status(400).json({ error: 'user displayName and inviteCode are required', code: 'auth/displayname-invitecode-required' });
  }

  const invite = invites.get(inviteCode);
  if (!invite) {
  return res.status(404).json({ error: 'invalid invite code', code: 'auth/invalid-invite-code' });
  }

  // Check if invite is expired
  if (new Date(invite.expiresAt) < new Date()) {
  return res.status(400).json({ error: 'invite code has expired', code: 'auth/invite-code-expired' });
  }

  // Check if invite is already used
  if (invite.usedAt) {
  return res.status(400).json({ error: 'invite code has already been used', code: 'auth/invite-code-used' });
  }

  const organization = organizations.get(invite.orgId);
  if (!organization) {
  return res.status(404).json({ error: 'organization not found for invite', code: 'auth/org-not-found-for-invite' });
  }

  // Update or create user
  const email = norm(userInfo.email);
  let user = users.get(email);
  const userId = user?.id || randomUUID();
  const now = new Date().toISOString();

  if (user) {
    // Update existing user
    user.displayName = userInfo.displayName;
    user.firstName = userInfo.firstName;
    user.lastName = userInfo.lastName;
    user.jobTitle = userInfo.jobTitle;
    user.department = userInfo.department;
    user.phoneNumber = userInfo.phoneNumber;
    user.timezone = userInfo.timezone;
    user.role = invite.role;
    user.orgId = invite.orgId;
    user.onboardingComplete = true;
  } else {
    // Create new user
    user = {
      id: userId,
      email: email,
      password: 'temp-password', // Should be set during registration
      displayName: userInfo.displayName,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      jobTitle: userInfo.jobTitle,
      department: userInfo.department,
      phoneNumber: userInfo.phoneNumber,
      timezone: userInfo.timezone || 'UTC',
      role: invite.role,
      orgId: invite.orgId,
      onboardingComplete: true,
      createdAt: now,
    };
    users.set(email, user);
  }

  // Mark invite as used
  invite.usedAt = now;
  invite.usedBy = userId;

  return res.status(200).json({
    success: true,
    message: 'onboarding completed - joined organization',
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
    organization: {
      id: organization.id,
      name: organization.name,
      displayName: organization.displayName,
      role: user.role,
    },
  });
});

// Get organizations (for admin)
router.get('/organizations', (req, res) => {
  const orgsArray = Array.from(organizations.values()).map(org => ({
    id: org.id,
    name: org.name,
    displayName: org.displayName,
    industry: org.industry,
    size: org.size,
    createdAt: org.createdAt,
  }));

  return res.status(200).json({
    success: true,
    organizations: orgsArray,
  });
});

// Get users (for admin)
router.get('/users', (req, res) => {
  const usersArray = Array.from(users.values()).map(user => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    orgId: user.orgId,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }));

  return res.status(200).json({
    success: true,
    users: usersArray,
  });
});

// Get invite codes (for admin)
router.get('/invites', (req, res) => {
  const invitesArray = Array.from(invites.values()).map(invite => ({
    id: invite.id,
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

export default router;
