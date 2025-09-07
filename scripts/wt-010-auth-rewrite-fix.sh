#!/usr/bin/env bash
# scripts/wt-010-auth-rewrite-fix.sh
# Purpose: Fix Next→API health check mismatch, kill 307s, normalize email to stop false 401s.
# Usage:
#   chmod +x scripts/wt-010-auth-rewrite-fix.sh
#   ./scripts/wt-010-auth-rewrite-fix.sh

set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1 || { echo "ERR: missing tool: $1"; exit 1; }; }
run_dlx() {
  if command -v pnpm >/dev/null 2>&1; then pnpm dlx "$@"; else npx --yes "$@"; fi
}

need node
need bash

mkdir -p apps/web services/api/src scripts

# 1) Next config: disable trailingSlash; keep generic /api/:path* proxy
cat > apps/web/next.config.js <<'JS'
/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  async rewrites() {
    return [
      // Auth & API namespace
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` },
      // Convenience: allow /api/health and /api/status to reach backend root aliases (added below)
      // NOTE: These are redundant *after* we add /api/health|/api/status in the API itself,
      // but harmless to keep.
    ];
  },
};

module.exports = nextConfig;
JS

# 2) API index with /api/health and /api/status aliases
#    (Full file content for clarity/consistency)
cat > services/api/src/index.ts <<'TS'
import express from "express";
import cors from "cors";
import pino from "pino";
import authRouter from "./auth.js";

// Shared named exports used by other route modules (must be present for imports from ./index.js)
export const orgs: Map<string, any> = new Map();
export const users: Map<string, any> = new Map();

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

app.use(cors());
app.use(express.json());

// ---- Root probes ----
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

// ---- Aliases under /api (so /api/health and /api/status exist) ----
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

// ---- Diagnostics ----
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

// ---- Auth API ----
app.use("/api", authRouter);

// ---- Start ----
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  log.info({ port: PORT }, "scheduler-api listening");
});
TS

# 3) Auth router with email normalization (trim + lower) to avoid false 401s
cat > services/api/src/auth.ts <<'TS'
import { Router } from "express";
import { randomUUID } from "node:crypto";

type Role = "admin" | "member";
type UserRecord = {
  id: string;
  email: string;
  password: string; // dev-only plain text; replace with hash in prod
  role: Role;
  displayName?: string;
  orgId?: string | null;
  onboardingComplete?: boolean;
};

const users = new Map<string, UserRecord>();   // key by normalized email
const resetTokens = new Map<string, string>(); // token -> normalized email

const norm = (s: unknown) =>
  (typeof s === "string" ? s.trim().toLowerCase() : "");

const seedEmail = norm("cravenwspatrick@gmail.com");
if (!users.has(seedEmail)) {
  users.set(seedEmail, {
    id: randomUUID(),
    email: seedEmail,
    password: "pass456",
    role: "admin",
    displayName: "Admin",
    orgId: null,
    onboardingComplete: false,
  });
}

const router = Router();

router.post("/register", (req, res) => {
  const rawEmail = req.body?.email;
  const email = norm(rawEmail);
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

router.post("/login", (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? "");
  const u = email ? users.get(email) : null;
  if (!u || u.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  return res.status(200).json({
    message: "ok",
    user: { id: u.id, email: u.email, role: u.role, onboardingComplete: !!u.onboardingComplete },
  });
});

router.post("/forgot-password", (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;
  // Do not leak existence; always return 200
  if (!u) return res.status(200).json({ message: "if the account exists, a token has been sent" });

  const token = randomUUID();
  resetTokens.set(token, email);
  // Dev-only: return token to speed up local testing
  return res.status(200).json({ message: "reset token created", token });
});

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
  if (!u) return res.status(400).json({ error: "invalid state" });

  u.password = newPassword;
  resetTokens.delete(token);
  return res.status(200).json({ message: "password reset" });
});

export default router;
TS

# 4) Optional: quick format + syntax-only TS check
echo "==> Formatting (Prettier) and syntax check (tsc --noResolve)"
run_dlx prettier@3.3.3 --write "apps/web/**/*.{ts,tsx,js,jsx}" "services/api/**/*.ts" >/dev/null
# Use explicit pnpm dlx invocation for tsc to avoid multiple-bins ambiguity and pass
# expanded file lists so globs aren't passed to tsc directly.
if command -v pnpm >/dev/null 2>&1; then
  pnpm -w typecheck
else
  npx --yes tsc --noEmit --noResolve --skipLibCheck --jsx preserve $(find services/api/src -name '*.ts' -print) $(find apps/web/app -name '*.tsx' -print)
fi

echo "==> wt-010 applied."
echo "Next:"
echo "  pnpm --filter @services/api dev   # API on :3333"
echo "  pnpm --filter @apps/web dev       # Web on :3000"
echo "  curl -i http://localhost:3000/api/health  # now 200 via alias"
echo "  Login in browser with: cravenwspatrick@gmail.com / pass456"
