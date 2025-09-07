#!/usr/bin/env bash
set -euo pipefail

echo "==> Updating API: register + forgot-password..."
cat > services/api/src/auth.ts <<'EOF'
import { randomUUID } from "node:crypto";

type Org = { id: string; name: string; taxId: string };
type User = {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: "owner" | "member";
  orgId: string;
  ssn?: string;
  address?: string;
  withholdingAllowances?: number;
};

export const orgs = new Map<string, Org>();
export const users = new Map<string, User>();

// Demo register (create or join org)
export function registerUser(data: any): { user: User; org: Org } {
  let org: Org;
  if (data.orgChoice === "create") {
    org = { id: randomUUID(), name: data.org.name, taxId: data.org.taxId };
    orgs.set(org.id, org);
  } else {
    const existing = orgs.get(data.org.id);
    if (!existing) throw new Error("Org not found");
    org = existing;
  }

  const user: User = {
    id: randomUUID(),
    email: data.email,
    displayName: data.displayName,
    password: data.password,
    role: data.orgChoice === "create" ? "owner" : "member",
    orgId: org.id,
    ssn: data.w4?.ssn,
    address: data.w4?.address,
    withholdingAllowances: data.w4?.withholdingAllowances
  };
  users.set(user.id, user);

  return { user, org };
}

// Demo forgot-password
export function forgotPassword(email: string): string {
  const user = Array.from(users.values()).find(u => u.email === email);
  if (!user) throw new Error("User not found");
  return `Password reset link sent to ${email} (demo only).`;
}
EOF

echo "==> Updating API index.ts to mount routes..."
cat > services/api/src/index.ts <<'EOF'
import express from "express";
import cors from "cors";
import { registerUser, forgotPassword } from "./auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/register", (req, res) => {
  try {
    const result = registerUser(req.body);
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/forgot-password", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });
    const msg = forgotPassword(email);
    res.json({ ok: true, message: msg });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
EOF

echo "==> Updating Next.js API proxies..."
mkdir -p apps/web/app/api/register
cat > apps/web/app/api/register/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const r = await fetch(process.env.API_BASE_URL ?? "http://localhost:3001/api/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json({ error: "API failed", details: e }, { status: 502 });
  }
  return NextResponse.json(await r.json());
}
EOF

mkdir -p apps/web/app/api/forgot-password
cat > apps/web/app/api/forgot-password/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const r = await fetch(process.env.API_BASE_URL ?? "http://localhost:3001/api/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json({ error: "API failed", details: e }, { status: 502 });
  }
  return NextResponse.json(await r.json());
}
EOF

echo "==> Done: backend + Next.js API endpoints for Register & Forgot Password."
