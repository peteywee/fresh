#!/usr/bin/env bash
set -euo pipefail

echo "==> Updating types..."
cat > packages/types/src/login.ts <<'EOF'
import { z } from "zod";

export const Role = z.enum(["manager", "user"]);
export type Role = z.infer<typeof Role>;

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string().email(),
  role: Role
});
export type LoginResponse = z.infer<typeof LoginResponse>;
EOF

echo "==> Seeding demo users in API..."
cat > services/api/src/seed.ts <<'EOF'
import { randomUUID } from "node:crypto";

export const demoUsers = [
  {
    id: randomUUID(),
    displayName: "Mary Manager",
    email: "manager@example.com",
    password: "manager123",
    role: "manager" as const
  },
  {
    id: randomUUID(),
    displayName: "Ulysses User",
    email: "user@example.com",
    password: "user123",
    role: "user" as const
  }
];
EOF

echo "==> Adding login route in API..."
cat > services/api/src/routes-login.ts <<'EOF'
import { Router } from "express";
import { LoginRequest, LoginResponse } from "@packages/types/src/login.js";
import { demoUsers } from "./seed.js";

const router = Router();

router.post("/api/login", (req, res) => {
  const parsed = LoginRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = demoUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const resp = LoginResponse.parse({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role
  });

  return res.status(200).json(resp);
});

export default router;
EOF

echo "==> Updating API entry to use login route..."
sed -i '/express.json()/a \
import loginRouter from "./routes-login.js";\napp.use(loginRouter);' services/api/src/index.ts

echo "==> Creating login screen in web app..."
mkdir -p "apps/web/app/(public)/login"
cat > "apps/web/app/(public)/login/page.tsx" <<'EOF'
"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function doLogin() {
    const r = await fetch("/api/session/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert("Login failed: " + (d.error ?? r.statusText));
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main style={{ display: "grid", gap: 12, maxWidth: 400 }}>
      <h1>Login</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={doLogin}>Login</button>
      <button disabled style={{ opacity: 0.6 }}>Forgot Password</button>
      <button disabled style={{ opacity: 0.6 }}>Register</button>
    </main>
  );
}
EOF

echo "==> Creating login API proxy in web app..."
mkdir -p apps/web/app/api/session
cat > apps/web/app/api/session/login/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(process.env.API_BASE_URL ?? "http://localhost:3001/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json({ error: "API login failed", details: e }, { status: r.status });
  }

  const data = await r.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", JSON.stringify({
    loggedIn: true,
    onboarded: true,
    displayName: data.displayName,
    role: data.role
  }), { httpOnly: true, path: "/" });
  return res;
}
EOF

echo "==> Updating dashboard to show role..."
cat > apps/web/app/dashboard/page.tsx <<'EOF'
import { getSession } from "../../lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.loggedIn) return redirect("/login");

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.displayName ?? "User"}!</p>
      <p>Your role: {session.role ?? "unknown"}</p>
      {session.role === "manager" && <p>You have manager-level access.</p>}
      {session.role === "user" && <p>You have user-level access.</p>}
    </main>
  );
}
EOF

echo "==> Done. Seeded users:"
echo "  Manager → manager@example.com / manager123"
echo "  User    → user@example.com / user123"
