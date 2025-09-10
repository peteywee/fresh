import { Router, Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { Role } from "../../../packages/types/src/index.js";
type UserRecord = {
  id: string;
  email: string;
  password: string; // dev-only plain text; replace with hash in prod
  role: Role;
  displayName?: string;
  orgId?: string | null;
  onboardingComplete?: boolean;
};

const users = new Map<string, UserRecord>(); // key by normalized email
const resetTokens = new Map<string, string>(); // token -> normalized email

const norm = (s: unknown) =>
  typeof s === "string" ? s.trim().toLowerCase() : "";

const seedEmail = norm("cravenwspatrick@gmail.com");
if (!users.has(seedEmail)) {
  users.set(seedEmail, {
    id: randomUUID(),
    email: seedEmail,
    password: "pass456",
    role: "owner",
    displayName: "Owner",
    orgId: null,
    onboardingComplete: false,
  });
}

// Role enforcement middleware
function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const email = norm(req.body?.email || req.query?.email);
    const u = email ? users.get(email) : null;
    if (!u || !roles.includes(u.role as Role)) {
      return res.status(403).json({ error: "forbidden: insufficient role" });
    }
    next();
  };
}

const router = Router();

router.post("/register", (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? "");
  const displayName = String(req.body?.displayName ?? "");
  const orgChoice = String(req.body?.orgChoice ?? "create");
  const org = req.body?.org ?? null;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: "email already registered" });
  }

  // Only the first user is owner, others are member by default
  const u: UserRecord = {
    id: randomUUID(),
    email,
    password,
    role: users.size === 0 ? "owner" : "member",
    displayName: displayName || email.split("@")[0],
    orgId: orgChoice === "join" ? (org?.id ?? null) : null,
    onboardingComplete: false,
  };
  users.set(email, u);
  return res.status(201).json({ message: "registered", userId: u.id });
});

router.post("/login", (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? "");
  const u = email ? users.get(email) : null;
  if (!u || u.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  return res.status(200).json({
    message: "ok",
    user: {
      id: u.id,
      email: u.email,
      role: u.role,
      onboardingComplete: !!u.onboardingComplete,
    },
  });
});

router.post("/forgot-password", (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;
  // Do not leak existence; always return 200
  if (!u)
    return res
      .status(200)
      .json({ message: "if the account exists, a token has been sent" });

  const token = randomUUID();
  resetTokens.set(token, email);
  // Dev-only: return token to speed up local testing
  return res.status(200).json({ message: "reset token created", token });
});

router.post("/reset-password", (req, res) => {
  const token = String(req.body?.token ?? "");
  const newPassword = String(req.body?.newPassword ?? "");
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "token and newPassword are required" });
  }
  const email = resetTokens.get(token);
  if (!email) {
    return res.status(400).json({ error: "invalid or expired token" });
  }
  const u = users.get(email);
  if (!u) return res.status(400).json({ error: "invalid state" });

  u.password = newPassword;
  resetTokens.delete(token);
  return res.status(200).json({ message: "password reset" });
});

router.post("/onboarding/complete", requireRole(["owner", "admin"]), (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;
  if (!u) {
    return res.status(401).json({ error: "user not found" });
  }

  // Mark onboarding as complete
  u.onboardingComplete = true;
  // Only owner/admin can set role, otherwise default to member
  if (req.body?.role && ["owner", "admin", "member"].includes(req.body.role)) {
    u.role = req.body.role;
  }
  // Return updated user info
  return res.status(200).json({
    message: "onboarding completed",
    user: {
      id: u.id,
      email: u.email,
      role: u.role,
      displayName: u.displayName,
      onboardingComplete: u.onboardingComplete,
    },
    org: u.orgId ? { id: u.orgId, name: "Default Organization" } : null,
  });
});

export default router;
