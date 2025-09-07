#!/usr/bin/env bash
# scripts/wt-009-unified.sh
# Purpose: One-shot patch to fix Sign Up + Forgot/Reset flows, add Next→API proxy, scaffold onboarding,
#          format sources, and run TS/TSX syntax checks (without module resolution).
# Usage:
#   chmod +x scripts/wt-009-unified.sh
#   ./scripts/wt-009-unified.sh

set -euo pipefail

echo "==> WT-009 (Unified) — Auth fixes, proxy, onboarding, lint & syntax check"

# --- Helpers ---------------------------------------------------------------

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERR: missing required tool: $1"; exit 1; }
}

ensure_dir() {
  mkdir -p "$1"
}

# Prefer pnpm if present; fall back to npx for dlx-equivalent behavior
run_dlx() {
  local pkg="$1"; shift
  if command -v pnpm >/dev/null 2>&1; then
    pnpm dlx "$pkg" "$@"
  else
    npx --yes "$pkg" "$@"
  fi
}

# --- Preflight -------------------------------------------------------------

need node
need bash

# Warn but do not fail if pnpm is missing (we’ll use npx fallback)
if ! command -v pnpm >/dev/null 2>&1; then
  echo "WARN: pnpm not found; using npx for formatter/compiler steps."
fi

# --- File writes -----------------------------------------------------------

# Next.js rewrite: proxy /api/** to Express at API_URL (default localhost:3333)
ensure_dir "apps/web"
cat > apps/web/next.config.js <<'JS'
/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:3333";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_URL}/api/:path*` }
    ];
  },
};

module.exports = nextConfig;
JS

# Public auth pages
ensure_dir "apps/web/app/(public)/login"
cat > 'apps/web/app/(public)/login/page.tsx' <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function doLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (r.ok) {
      router.push("/onboarding");
    } else {
      const d = await r.json().catch(() => ({}));
      setMsg(d?.error || "Login failed");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <form onSubmit={doLogin} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit">Login</button>
      </form>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={() => router.push("/register")}>Sign Up</button>
        <button onClick={() => router.push("/forgot-password")}>Forgot Password</button>
      </div>

      {msg && <p style={{ color: "crimson", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
TSX

ensure_dir "apps/web/app/(public)/register"
cat > 'apps/web/app/(public)/register/page.tsx' <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Form = {
  email: string;
  password: string;
  displayName: string;
  orgChoice: "create" | "join";
  orgName: string;
  orgId: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({
    email: "",
    password: "",
    displayName: "",
    orgChoice: "create",
    orgName: "",
    orgId: ""
  });
  const [msg, setMsg] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const body: any = {
      email: form.email,
      password: form.password,
      displayName: form.displayName,
      orgChoice: form.orgChoice,
      org: form.orgChoice === "create"
        ? { name: form.orgName }
        : { id: form.orgId }
    };

    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg("Register failed: " + (d.error ?? r.statusText));
      return;
    }
    router.push("/login");
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, display: "grid", gap: 12 }}>
      <h1>Register</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          autoComplete="email"
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          autoComplete="new-password"
        />
        <input
          placeholder="Display Name"
          value={form.displayName}
          onChange={e => setForm({ ...form, displayName: e.target.value })}
        />

        <select
          value={form.orgChoice}
          onChange={e => setForm({ ...form, orgChoice: e.target.value as Form["orgChoice"] })}
        >
          <option value="create">Create Organization</option>
          <option value="join">Join Organization</option>
        </select>

        {form.orgChoice === "create" ? (
          <input
            placeholder="Organization Name"
            value={form.orgName}
            onChange={e => setForm({ ...form, orgName: e.target.value })}
          />
        ) : (
          <input
            placeholder="Organization ID"
            value={form.orgId}
            onChange={e => setForm({ ...form, orgId: e.target.value })}
          />
        )}

        <button type="submit">Create account</button>
      </form>

      <button onClick={() => router.push("/login")}>Back to login</button>

      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    </main>
  );
}
TSX

ensure_dir "apps/web/app/(public)/forgot-password"
cat > 'apps/web/app/(public)/forgot-password/page.tsx' <<'TSX'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg(d.message ?? "Check your email for the reset token.");
      if (d.token) setToken(d.token); // dev-only convenience
    } else {
      setMsg(d.error ?? "Request failed");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Forgot Password</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button type="submit">Send reset token</button>
      </form>

      {token && (
        <div style={{ marginTop: 12 }}>
          <p>Dev token: <code>{token}</code></p>
          <button onClick={() => router.push(`/reset-password?token=${encodeURIComponent(token)}`)}>
            Continue to reset page
          </button>
        </div>
      )}

      {msg && <p style={{ color: "crimson", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
TSX

ensure_dir "apps/web/app/(public)/reset-password"
cat > 'apps/web/app/(public)/reset-password/page.tsx' <<'TSX'
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const t = params.get("token");
    if (t) setToken(t);
  }, [params]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setMsg("");
    const r = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: password })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg("Password reset. Redirecting to login...");
      setTimeout(() => router.push("/login"), 800);
    } else {
      setMsg(d.error ?? "Reset failed");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Reset Password</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Token"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <input
          placeholder="New password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Reset</button>
      </form>
      {msg && <p style={{ color: "crimson", marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
TSX

# Onboarding scaffold
ensure_dir "apps/web/app/(onboarding)"
cat > 'apps/web/app/(onboarding)/page.tsx' <<'TSX'
export default function OnboardingIndex() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Onboarding</h1>
      <p>Choose an onboarding path:</p>
      <ul>
        <li><a href="/onboarding/user">User Profile</a></li>
        <li><a href="/onboarding/org">Organization</a></li>
      </ul>
    </main>
  );
}
TSX

ensure_dir "apps/web/app/(onboarding)/user"
cat > 'apps/web/app/(onboarding)/user/page.tsx' <<'TSX'
"use client";

import { useRouter } from "next/navigation";

export default function OnboardUser() {
  const router = useRouter();
  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Onboarding — User</h1>
      <p>TODO: gather user profile fields.</p>
      <button onClick={() => router.push("/onboarding/org")}>Next: Organization</button>
    </main>
  );
}
TSX

ensure_dir "apps/web/app/(onboarding)/org"
cat > 'apps/web/app/(onboarding)/org/page.tsx' <<'TSX'
"use client";

import { useRouter } from "next/navigation";

export default function OnboardOrg() {
  const router = useRouter();
  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Onboarding — Organization</h1>
      <p>TODO: create or join an org. This will save to API later.</p>
      <button onClick={() => router.push("/onboarding")}>Finish</button>
    </main>
  );
}
TSX

# API auth router + index
ensure_dir "services/api/src"
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

const users = new Map<string, UserRecord>();          // email -> user
const resetTokens = new Map<string, string>();         // token -> email

// Seed admin (from your spec)
const seedEmail = "cravenwspatrick@gmail.com";
if (!users.has(seedEmail)) {
  users.set(seedEmail, {
    id: randomUUID(),
    email: seedEmail,
    password: "pass456",
    role: "admin",
    displayName: "Admin",
    orgId: null,
    onboardingComplete: false
  });
}

const router = Router();

router.post("/register", (req, res) => {
  const { email, password, displayName, orgChoice, org } = req.body || {};
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
    orgId: orgChoice === "join" ? org?.id ?? null : null,
    onboardingComplete: false
  };
  users.set(email, u);
  return res.status(201).json({ message: "registered", userId: u.id });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = email ? users.get(email) : null;
  if (!u || u.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }
  return res.status(200).json({
    message: "ok",
    user: { id: u.id, email: u.email, role: u.role, onboardingComplete: !!u.onboardingComplete }
  });
});

router.post("/forgot-password", (req, res) => {
  const { email } = req.body || {};
  const u = email ? users.get(email) : null;
  if (!u) {
    // Do not leak existence; return 200
    return res.status(200).json({ message: "if the account exists, a token has been sent" });
  }
  const token = randomUUID();
  resetTokens.set(token, email);
  // Dev-only: return token in response so you can copy/paste
  return res.status(200).json({ message: "reset token created", token });
});

router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
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
TS

cat > services/api/src/index.ts <<'TS'
import express from "express";
import cors from "cors";
import pino from "pino";
import authRouter from "./auth";

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

app.use(cors());
app.use(express.json());

// Liveness
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
});

// Extended status
app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

// Probe must be TRUE and show a runId (from header)
app.get("/__ /probe".replace(/ /g, ''), (req, res) => {
  const runId = req.header("x-run-id") || null;
  res.status(200).json({ ok: true, runId, probedAt: new Date().toISOString() });
});

// Echo must include a hierarchy object (driven by headers)
app.get("/hierarchy/echo", (req, res) => {
  const hierarchy = {
    runId: req.header("x-run-id") || "run-unknown",
    user: req.header("x-user") || "anonymous",
    object: req.header("x-obj") || "unspecified",
    task: req.header("x-task") || "unspecified",
    step: req.header("x-step") || "unspecified"
  };
  res.status(200).json({ ok: true, hierarchy, headers: req.headers });
});

// Auth API
app.use("/api", authRouter);

// Start server
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  log.info({ port: PORT }, "scheduler-api listening");
});
TS

# --- Formatting (Prettier) -------------------------------------------------
echo "==> Formatting with Prettier (writes in-place)..."
run_dlx prettier@3.3.3 --write \
  "apps/web/**/*.{ts,tsx,js,jsx}" \
  "services/api/**/*.ts" \
  "scripts/**/*.sh" \
  >/dev/null

# --- Syntax check (TypeScript, syntax-only) --------------------------------
# Use --noResolve to avoid module resolution/type acquisition; this catches TS/TSX syntax errors quickly.
echo "==> Syntax check (tsc --noResolve, no emit)..."
run_dlx typescript@5.5.4 tsc \
  --noEmit \
  --noResolve \
  --skipLibCheck \
  --jsx preserve \
  --target ES2022 \
  --moduleResolution Bundler \
  "apps/web/app/(public)/**/*.tsx" \
  "apps/web/app/(onboarding)/**/*.tsx" \
  "services/api/src/**/*.ts"

echo "==> WT-009 complete."
echo "Next steps:"
echo "  1) Start API: pnpm --filter @services/api dev    (or your existing script)"
echo "  2) Start Web: pnpm --filter @apps/web dev"
echo "  3) Browser: http://localhost:3000/login"
echo "     - Register -> back to Login -> Login -> /onboarding"
echo "     - Forgot Password -> token -> Reset -> Login"
