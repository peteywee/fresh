#!/usr/bin/env bash
set -euo pipefail

# Move helper scripts into scripts/ (best-effort)
echo "==> Moving scripts to root-level scripts/ folder..."
mkdir -p scripts
git mv -f dev.sh scripts/dev.sh 2>/dev/null || true
git mv -f apply-heredoc.sh scripts/apply-heredoc.sh 2>/dev/null || true
git mv -f diagnose-auth.sh scripts/diagnose-auth.sh 2>/dev/null || true
git mv -f fix-session.sh scripts/fix-session.sh 2>/dev/null || true
git mv -f fix-auth.sh scripts/fix-auth.sh 2>/dev/null || true
git mv -f clean.sh scripts/clean.sh 2>/dev/null || true

# Overwrite auth pages under apps/web/app/(public)/ using quoted paths

echo "==> Updating Login page..."
mkdir -p 'apps/web/app/(public)/login'
cat > 'apps/web/app/(public)/login/page.tsx' <<'TSX'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  async function doLogin() {
    if (attempts >= 5) {
      setMessage("Too many failed attempts. Please wait before trying again.");
      return;
    }
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      window.location.href = "/dashboard";
    } else {
      setAttempts(attempts + 1);
      setMessage("Login failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={doLogin}>Login</button>
      <button onClick={() => router.push("/register")}>Sign Up</button>
      <button onClick={() => router.push("/forgot-password")}>Forgot Password</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> Updating Register page..."
mkdir -p 'apps/web/app/(public)/register'
cat > 'apps/web/app/(public)/register/page.tsx' <<'TSX'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function doRegister() {
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/login");
    } else {
      setMessage("Register failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Sign Up</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={doRegister}>Create Account</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> Updating Forgot Password page..."
mkdir -p 'apps/web/app/(public)/forgot-password'
cat > 'apps/web/app/(public)/forgot-password/page.tsx' <<'TSX'
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function doForgot() {
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/reset-password");
    } else {
      setMessage("Request failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Forgot Password</h1>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={doForgot}>Send Reset Link</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> Updating Reset Password page..."
mkdir -p 'apps/web/app/(public)/reset-password'
cat > 'apps/web/app/(public)/reset-password/page.tsx' <<'TSX'
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  async function doReset() {
    const r = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      router.push("/login");
    } else {
      setMessage("Reset failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Reset Password</h1>
      <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
      <button onClick={doReset}>Reset</button>
      <button onClick={() => router.push("/login")}>Back to Login</button>
      {message && <p>{message}</p>}
    </main>
  );
}
TSX

echo "==> Done. Auth flow fixed, scripts moved."

exit 0
EOF

chmod +x scripts/fix-auth-flow.sh
