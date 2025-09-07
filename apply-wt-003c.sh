#!/usr/bin/env bash
set -euo pipefail

echo "==> Updating login page to wire Register + Forgot Password..."
cat > apps/web/app/(public)/login/page.tsx <<'EOF'
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function doLogin() {
    const r = await fetch("/api/session/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (r.ok) {
      window.location.href = "/onboarding";
    } else {
      setMessage("Login failed");
    }
  }

  async function doRegister() {
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName: email.split("@")[0],
        orgChoice: "create",
        org: { name: "New Org", taxId: "99-9999999" },
        w4: { ssn: "000-00-0000", address: "123 Demo St", withholdingAllowances: 1 }
      })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMessage("Registered successfully. Please login.");
    } else {
      setMessage("Register failed: " + (d.error ?? "unknown"));
    }
  }

  async function doForgot() {
    if (!email) return setMessage("Enter your email first.");
    const r = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMessage(d.message ?? "Check your email.");
    } else {
      setMessage("Forgot password failed: " + (d.error ?? "unknown"));
    }
  }

  return (
    <main>
      <h1>Login</h1>
      <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button onClick={doLogin} style={{ padding: "8px 16px" }}>Login</button>
        <button onClick={doRegister} style={{ padding: "8px 16px" }}>Register</button>
        <button onClick={doForgot} style={{ padding: "8px 16px" }}>Forgot Password</button>
        {message && <p>{message}</p>}
      </div>
    </main>
  );
}
EOF

echo "==> Done. Buttons now call backend endpoints."
