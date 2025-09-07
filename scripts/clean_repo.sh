#!/usr/bin/env bash
#
# clean_repo.sh – script to clean up and standardise the peteywee/fresh monorepo.
#
# This script removes obsolete files and rewrites key modules with the known‑good
# implementations discussed in our troubleshooting notes.  Run this script from
# the root of your cloned `fresh` repository.  After running it you should run
# `pnpm install` and `pnpm -w typecheck` to ensure the repository typechecks.

set -euo pipefail

# Remove outdated API route modules that duplicate logic now handled in auth.ts.
for f in \
    services/api/src/routes-register.ts \
    services/api/src/routes-login.ts \
    services/api/src/seed.ts; do
    [ -e "$f" ] && rm -f "$f" || true
done

# Remove redundant legacy type definitions.  The shared types are now defined
# under packages/types/src/index.ts and onboarding.ts.  Delete these if they
# exist to avoid confusion.
for f in \
    packages/types/src/login.ts \
    packages/types/src/register.ts \
    packages/types/src/user.ts; do
    [ -e "$f" ] && rm -f "$f" || true
done

# Overwrite services/api/src/index.ts with a clean implementation.  This
# version exports the shared in‑memory maps (orgs and users), mounts the
# unified auth router, and exposes health and status probes both at the root
# and under /api.  It listens on port 3333 by default.
cat > services/api/src/index.ts <<'EOF_JS'
import express from "express";
import cors from "cors";
import pino from "pino";
import authRouter from "./auth.js";

// Shared in‑memory stores.  Other modules can import these if needed.
export const orgs = new Map();
export const users = new Map();

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

app.use(cors());
app.use(express.json());

// Health and status endpoints at the root
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
});
app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Aliases for health and status under /api to support probes via the Next.js rewrite
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
});
app.get("/api/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Diagnostic endpoints
app.get("/__/probe", (req, res) => {
  const runId = req.header("x-run-id") || null;
  res.status(200).json({ ok: true, runId, probedAt: new Date().toISOString() });
});
app.get("/hierarchy/echo", (req, res) => {
  const hierarchy = {
    runId: req.header("x-run-id") || "run-unknown",
    user: req.header("x-user") || "anonymous",
    object: req.header("x-obj") || "unspecified",
    task: req.header("x-task") || "unspecified",
    step: req.header("x-step") || "unspecified",
  };
  res.status(200).json({ ok: true, hierarchy, headers: req.headers });
});

// Mount unified auth API under /api
app.use("/api", authRouter);

// Start the server
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  log.info({ port: PORT }, "scheduler-api listening");
});
EOF_JS

# Overwrite services/api/src/auth.ts with the latest unified auth router.  This
# version normalises emails (trim+lower) and stores users by email key.  It
# exposes register, login, forgot-password and reset-password endpoints and
# returns consistent JSON responses.
cat > services/api/src/auth.ts <<'EOF_JS'
import { Router } from "express";
import { randomUUID } from "node:crypto";

type Role = "admin" | "member";
type UserRecord = {
  id: string;
  email: string;
  password: string;
  role: Role;
  displayName?: string;
  orgId?: string | null;
  onboardingComplete?: boolean;
};

// Normalisation helper: trim and lower‑case strings
const norm = (s: unknown) =>
  typeof s === "string" ? s.trim().toLowerCase() : "";

// In‑memory store keyed by normalised email
const users = new Map<string, UserRecord>();
// Token store for password resets (token -> email)
const resetTokens = new Map<string, string>();

// Seed an admin account
const adminEmail = norm("cravenwspatrick@gmail.com");
if (!users.has(adminEmail)) {
  users.set(adminEmail, {
    id: randomUUID(),
    email: adminEmail,
    password: "pass456",
    role: "admin",
    displayName: "Admin",
    orgId: null,
    onboardingComplete: false,
  });
}

const router = Router();

// Registration endpoint
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
  const u: UserRecord = {
    id: randomUUID(),
    email,
    password,
    role: "member",
    displayName: displayName || email.split("@")[0],
    orgId: orgChoice === "join" ? (org?.id ?? null) : null,
    onboardingComplete: false,
  };
  users.set(email, u);
  return res.status(201).json({ message: "registered", userId: u.id });
});

// Login endpoint
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

// Forgot password endpoint
router.post("/forgot-password", (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;
  // Do not reveal whether account exists
  if (!u) {
    return res.status(200).json({ message: "if the account exists, a token has been sent" });
  }
  const token = randomUUID();
  resetTokens.set(token, email);
  // In production, email the token; for dev return it inline
  return res.status(200).json({ message: "reset token created", token });
});

// Reset password endpoint
router.post("/reset-password", (req, res) => {
  const token = String(req.body?.token ?? "");
  const newPassword = String(req.body?.newPassword ?? "");
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }
  const email = resetTokens.get(token);
  if (!email) {
    return res.status(400).json({ error: "invalid or expired token" });
  }
  const u = users.get(email);
  if (!u) {
    return res.status(400).json({ error: "invalid state" });
  }
  u.password = newPassword;
  resetTokens.delete(token);
  return res.status(200).json({ message: "password reset" });
});

export default router;
EOF_JS

# Overwrite apps/web/middleware.ts to enforce allowlist and avoid 307 loops.  It
# passes through static assets and public pages and redirects gated pages
# without session to /login.  Session detection is stubbed (always false).
cat > apps/web/middleware.ts <<'EOF_TS'
import { NextRequest, NextResponse } from "next/server";

// Public routes and API endpoints that should not trigger auth redirects
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/health",
  "/api/status",
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/favicon.ico",
]);

// Identify static asset paths (Next.js internals and user assets)
function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/assets")
  );
}

// TODO: replace with real session detection once cookies are implemented
function hasSession(_req: NextRequest): boolean {
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  if (isAsset(pathname) || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }
  const requiresAuth =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app");
  if (requiresAuth && !hasSession(req)) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Configure middleware to run on all routes except static files
export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
EOF_TS

# Overwrite apps/web/next.config.js to keep rewrite and trailingSlash settings
cat > apps/web/next.config.js <<'EOF_JS'
/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
    ];
  },
};

module.exports = nextConfig;
EOF_JS

echo "Repository cleaned.  Please run 'pnpm install' followed by 'pnpm -w typecheck' to verify the changes."