#!/usr/bin/env bash
set -euo pipefail

echo "==> WT-001 scaffolding: creating folders..."
mkdir -p packages/types/src
mkdir -p services/api/src
mkdir -p 'apps/web/app/(public)/login'
mkdir -p 'apps/web/app/(onboarding)'
mkdir -p apps/web/app/dashboard
mkdir -p apps/web/app/api/session/login
mkdir -p apps/web/app/api/onboarding/complete
mkdir -p apps/web/lib

echo "==> Writing packages/types/package.json"
cat > packages/types/package.json <<'EOF'
{
  "name": "@packages/types",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4"
  }
}
EOF

echo "==> Writing packages/types/tsconfig.json"
cat > packages/types/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "declaration": true,
    "emitDeclarationOnly": false,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

echo "==> Writing packages/types/src/index.ts"
cat > packages/types/src/index.ts <<'EOF'
import { z } from "zod";

export const Role = z.enum(["owner", "admin", "member"]);
export type Role = z.infer<typeof Role>;

export const Organization = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  createdAt: z.string()
});
export type Organization = z.infer<typeof Organization>;

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  orgId: z.string().uuid().optional(),
  role: Role.optional()
});
export type User = z.infer<typeof User>;

export const OnboardingRequest = z.object({
  user: z.object({
    email: z.string().email(),
    displayName: z.string().min(1)
  }),
  org: z.object({
    name: z.string().min(2)
  })
});
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;

export const OnboardingResponse = z.object({
  user: User,
  org: Organization
});
export type OnboardingResponse = z.infer<typeof OnboardingResponse>;
EOF

echo "==> Writing services/api/src/index.ts"
cat > services/api/src/index.ts <<'EOF'
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { OnboardingRequest, OnboardingResponse, Organization, User } from "@packages/types/src/index.js";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory "db" (replace later with Postgres/Firestore)
const orgs = new Map<string, z.infer<typeof Organization>>();
const users = new Map<string, z.infer<typeof User>>();

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/onboarding/complete", (req, res) => {
  const parsed = OnboardingRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }
  const { user: u, org: o } = parsed.data;

  const orgId = randomUUID();
  const userId = randomUUID();
  const now = new Date().toISOString();

  const org = {
    id: orgId,
    name: o.name,
    createdAt: now
  };
  orgs.set(orgId, org);

  const user = {
    id: userId,
    email: u.email,
    displayName: u.displayName,
    orgId,
    role: "owner" as const
  };
  users.set(userId, user);

  const resp: z.infer<typeof OnboardingResponse> = { user, org };
  return res.status(201).json(resp);
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
EOF

echo "==> Writing apps/web/app/layout.tsx"
cat > apps/web/app/layout.tsx <<'EOF'
export const metadata = {
  title: "Fresh",
  description: "WT-001 onboarding demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell" }}>
        <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
EOF

echo "==> Writing apps/web/app/page.tsx (redirector)"
cat > apps/web/app/page.tsx <<'EOF'
import { redirect } from "next/navigation";
import { getSession } from "../lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session?.loggedIn) return redirect("/login");
  if (!session?.onboarded) return redirect("/onboarding");
  return redirect("/dashboard");
}
EOF

echo "==> Writing apps/web/app/(public)/login/page.tsx"
cat > 'apps/web/app/(public)/login/page.tsx' <<'EOF'
"use client";

export default function LoginPage() {
  async function doLogin() {
    await fetch("/api/session/login", { method: "POST" });
    window.location.href = "/onboarding";
  }
  return (
    <main>
      <h1>Login</h1>
      <p>This demo sets a local session cookie (no external IdP yet).</p>
      <button onClick={doLogin} style={{ padding: "8px 16px" }}>Login</button>
    </main>
  );
}
EOF

echo "==> Writing apps/web/app/(onboarding)/page.tsx"
cat > 'apps/web/app/(onboarding)/page.tsx' <<'EOF'
"use client";
import { useState } from "react";

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");

  async function complete() {
    const r = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: { email, displayName }, org: { name: orgName } })
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      alert("Onboarding failed: " + (d.error ?? r.statusText));
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main>
      <h1>Onboarding</h1>
      <p>Create your organization and finalize your profile.</p>
      <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Name
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jane Doe" />
        </label>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
        </label>
        <label>
          Organization
          <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Acme, Inc." />
        </label>
        <button onClick={complete} style={{ padding: "8px 16px" }}>Complete</button>
      </div>
    </main>
  );
}
EOF

echo "==> Writing apps/web/app/dashboard/page.tsx"
cat > apps/web/app/dashboard/page.tsx <<'EOF'
import { getSession } from "../../lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await getSession();
  if (!session?.loggedIn) return redirect("/login");
  if (!session?.onboarded) return redirect("/onboarding");

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.displayName ?? "User"} — org: {session.orgName ?? "N/A"}</p>
    </main>
  );
}
EOF

echo "==> Writing apps/web/app/api/session/login/route.ts"
cat > apps/web/app/api/session/login/route.ts <<'EOF'
import { NextResponse } from "next/server";

export async function POST() {
  const session = {
    loggedIn: true,
    onboarded: false
  };
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", JSON.stringify(session), { httpOnly: true, path: "/" });
  return res;
}
EOF

echo "==> Writing apps/web/app/api/onboarding/complete/route.ts"
cat > apps/web/app/api/onboarding/complete/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const r = await fetch(process.env.API_BASE_URL ?? "http://localhost:3001/api/onboarding/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json({ error: "API failed", details: e }, { status: 502 });
  }
  const data = await r.json();

  const session = {
    loggedIn: true,
    onboarded: true,
    displayName: data?.user?.displayName,
    orgName: data?.org?.name
  };
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", JSON.stringify(session), { httpOnly: true, path: "/" });
  return res;
}
EOF

echo "==> Writing apps/web/lib/session.ts"
cat > apps/web/lib/session.ts <<'EOF'
import "server-only";

export type Session = {
  loggedIn: boolean;
  onboarded: boolean;
  displayName?: string;
  orgName?: string;
} | null;

export async function getSession(): Promise<Session> {
  // Next 15 App Router: use headers() rather than cookies() on the server to avoid edge/runtime quirks
  const { cookies } = await import("next/headers");
  const jar = cookies();
  const raw = jar.get("__session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
EOF

echo "==> Writing apps/web/middleware.ts (route guards)"
cat > apps/web/middleware.ts <<'EOF'
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const sessionRaw = req.cookies.get("__session")?.value;

  let session: any = null;
  try { session = sessionRaw ? JSON.parse(sessionRaw) : null; } catch {}

  const isPublic = path.startsWith("/login") || path.startsWith("/api/session");
  if (isPublic) return NextResponse.next();

  const loggedIn = !!session?.loggedIn;
  const onboarded = !!session?.onboarded;

  if (!loggedIn && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (loggedIn && !onboarded && !path.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (loggedIn && onboarded && (path === "/" || path === "/login" || path === "/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/session).*)"]
};
EOF

echo "==> Ensuring services/api/tsconfig.json exists"
cat > services/api/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": false,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
EOF

echo "==> Ensuring pnpm-workspace.yaml includes packages"
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
EOF

echo "==> Done."
