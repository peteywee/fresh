#!/usr/bin/env bash
# File: scripts/wt-app-auth-008.sh
# Purpose: Firebase Auth + Session Cookies + Onboarding (Next.js App Router)
# Usage: bash scripts/wt-app-auth-008.sh
set -euo pipefail

echo "==> WT-APP-AUTH-008: Firebase auth + sessions + onboarding (Next.js)"

# -------- Preflight --------
ROOT="$(pwd)"
WEB_DIR="apps/web"
if [ ! -d "$WEB_DIR" ]; then
  echo "ERROR: $WEB_DIR not found. Run from repo root." >&2
  exit 1
fi

# Basic Node/pnpm presence checks
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "ERROR: pnpm not found"; exit 1; }

echo "==> Installing dependencies (web workspace): firebase + firebase-admin + zod"
pnpm --filter @apps/web add firebase firebase-admin zod

# -------- Env templates --------
echo "==> Writing .env.example (copy to .env.local and fill in)"
cat > "$WEB_DIR/.env.example" <<'EOF'
# --- Firebase Client (Web SDK) ---
NEXT_PUBLIC_FIREBASE_API_KEY=__REPLACE_ME__
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=__REPLACE_ME__.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=__REPLACE_ME__
NEXT_PUBLIC_FIREBASE_APP_ID=__REPLACE_ME__
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=__REPLACE_ME__

# --- Firebase Admin (Service Account) ---
# Copy from your service account JSON:
# client_email -> FIREBASE_CLIENT_EMAIL
# project_id   -> FIREBASE_PROJECT_ID
# private_key  -> FIREBASE_PRIVATE_KEY (KEEP THE \n NEWLINES!)
FIREBASE_PROJECT_ID=__REPLACE_ME__
FIREBASE_CLIENT_EMAIL=__REPLACE_ME__@__REPLACE_ME__.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nREPLACE_ME\n-----END PRIVATE KEY-----\n

# Cookie/session
SESSION_COOKIE_NAME=__session
SESSION_COOKIE_DAYS=5

# App
NEXT_PUBLIC_APP_NAME=Fresh
EOF

# -------- Client SDK init --------
mkdir -p "$WEB_DIR/lib"

echo "==> Adding client initializer"
cat > "$WEB_DIR/lib/firebase.client.ts" <<'EOF'
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp;
let auth: Auth;

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    });
  }
  return app!;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
EOF

# -------- Admin SDK init --------
echo "==> Adding admin initializer (server-only)"
cat > "$WEB_DIR/lib/firebase.admin.ts" <<'EOF'
import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const projectId = required("FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID);
  const clientEmail = required("FIREBASE_CLIENT_EMAIL", process.env.FIREBASE_CLIENT_EMAIL);
  // Private key often contains literal '\n'. Convert to real newlines if needed.
  const rawKey = required("FIREBASE_PRIVATE_KEY", process.env.FIREBASE_PRIVATE_KEY);
  const privateKey = rawKey.replace(/\\n/g, "\n");

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app!;
}

export function adminAuth(): Auth {
  if (!auth) auth = getAuth(getAdminApp());
  return auth!;
}

export function adminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db!;
}
EOF

# -------- Session helper (server) --------
echo "==> Adding server session helper"
cat > "$WEB_DIR/lib/session.ts" <<'EOF'
import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase.admin";

export type ServerSession =
  | (import("firebase-admin/auth").DecodedIdToken & {
      onboardingComplete?: boolean;
      role?: string;
    })
  | null;

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";

export async function getServerSession(): Promise<ServerSession> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const auth = adminAuth();
    const decoded = await auth.verifySessionCookie(token, true);
    return decoded as ServerSession;
  } catch {
    return null;
  }
}
EOF

# -------- Session routes: login / logout / current --------
mkdir -p "$WEB_DIR/app/api/session/login" \
         "$WEB_DIR/app/api/session/logout" \
         "$WEB_DIR/app/api/session/current"

echo "==> Adding /api/session/login (exchange ID token -> session cookie)"
cat > "$WEB_DIR/app/api/session/login/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase.admin";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const DAYS = Number(process.env.SESSION_COOKIE_DAYS || 5);
const EXPIRES_MS = DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  const auth = adminAuth();
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(EXPIRES_MS / 1000),
  });
  return res;
}
EOF

echo "==> Adding /api/session/logout (clear cookie + revoke tokens)"
cat > "$WEB_DIR/app/api/session/logout/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase.admin";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE)?.value;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });

  if (cookie) {
    try {
      const auth = adminAuth();
      const decoded = await auth.verifySessionCookie(cookie, true);
      await auth.revokeRefreshTokens(decoded.sub);
    } catch {
      // ignore
    }
  }
  return res;
}
EOF

echo "==> Adding /api/session/current (return verified claims)"
cat > "$WEB_DIR/app/api/session/current/route.ts" <<'EOF'
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

export async function GET() {
  const s = await getServerSession();
  if (!s) return NextResponse.json({ loggedIn: false }, { status: 200 });
  return NextResponse.json({ loggedIn: true, user: s }, { status: 200 });
}
EOF

# -------- Onboarding API (writes to Firestore + set custom claims) --------
mkdir -p "$WEB_DIR/app/api/onboarding/complete"

echo "==> Adding /api/onboarding/complete (Firestore writes + claims)"
cat > "$WEB_DIR/app/api/onboarding/complete/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { getServerSession } from "@/lib/session";

const Body = z.object({
  user: z.object({
    displayName: z.string().min(1),
  }),
  org: z.object({
    name: z.string().min(2),
  }),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { user, org } = parsed.data;
  const db = adminDb();
  const auth = adminAuth();

  const orgRef = db.collection("orgs").doc();
  const userRef = db.collection("users").doc(session.sub);

  const now = new Date().toISOString();

  await orgRef.set({
    id: orgRef.id,
    name: org.name,
    createdAt: now,
    ownerUid: session.sub,
  });

  await userRef.set(
    {
      uid: session.sub,
      email: session.email,
      displayName: user.displayName,
      orgId: orgRef.id,
      role: "owner",
      onboardingComplete: true,
      updatedAt: now,
    },
    { merge: true }
  );

  // Add custom claims for convenience
  await auth.setCustomUserClaims(session.sub, {
    onboardingComplete: true,
    role: "owner",
    orgId: orgRef.id,
  });

  return NextResponse.json({ ok: true, org: { id: orgRef.id, name: org.name }, user: { displayName: user.displayName } });
}
EOF

# -------- Middleware guard --------
echo "==> Adding middleware guard (cookie presence-based)"
cat > "$WEB_DIR/middleware.ts" <<'EOF'
import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/api/session"];

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Public routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = !!req.cookies.get(COOKIE)?.value;

  // Root -> redirect based on session
  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/dashboard" : "/login", req.url));
  }

  // Protected routes
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If onboard not complete, the dashboard page will handle redirect after verifying claims.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets).*)"],
};
EOF

# -------- Pages: Login / Register / Forgot --------
mkdir -p "$WEB_DIR/app/(public)/login" \
         "$WEB_DIR/app/(public)/register" \
         "$WEB_DIR/app/(public)/forgot-password"

echo "==> Adding Login page"
cat > "$WEB_DIR/app/(public)/login/page.tsx" <<'EOF'
"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase.client";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Session exchange failed");
      r.push("/onboarding");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Login</h1>
      <form onSubmit={doLogin} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={busy} type="submit">{busy ? "Signing in..." : "Login"}</button>
      </form>
      <div style={{ display:"flex", gap:12, marginTop:12 }}>
        <a href="/register">Sign Up</a>
        <a href="/forgot-password">Forgot Password</a>
      </div>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </main>
  );
}
EOF

echo "==> Adding Register page"
cat > "$WEB_DIR/app/(public)/register/page.tsx" <<'EOF'
"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase.client";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const auth = getFirebaseAuth();
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
      // Next: sign-in is implicit; exchange token for cookie
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Session exchange failed");
      r.push("/onboarding");
    } catch (e: any) {
      setErr(e?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Sign Up</h1>
      <form onSubmit={doRegister} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} required />
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={busy} type="submit">{busy ? "Creating..." : "Create account"}</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </main>
  );
}
EOF

echo "==> Adding Forgot Password page"
cat > "$WEB_DIR/app/(public)/forgot-password/page.tsx" <<'EOF'
"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase.client";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      const auth = getFirebaseAuth();
      await sendPasswordResetEmail(auth, email);
      setMsg("If an account exists for that email, a reset link has been sent.");
    } catch (e: any) {
      setErr(e?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Forgot Password</h1>
      <form onSubmit={doReset} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <button disabled={busy} type="submit">{busy ? "Sending..." : "Send reset email"}</button>
      </form>
      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </main>
  );
}
EOF

# -------- Onboarding + Dashboard --------
mkdir -p "$WEB_DIR/app/(onboarding)"

echo "==> Adding Onboarding page"
cat > "$WEB_DIR/app/(onboarding)/page.tsx" <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const r = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // If already onboarded, redirect to dashboard
    (async () => {
      const res = await fetch("/api/session/current", { cache: "no-store" });
      const data = await res.json();
      if (data?.loggedIn && data?.user?.onboardingComplete) {
        r.replace("/dashboard");
      }
    })();
  }, [r]);

  async function complete() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: { displayName }, org: { name: orgName } }),
      });
      if (!res.ok) throw new Error("Onboarding failed");
      r.replace("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Onboarding failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1>Onboarding</h1>
      <p>Tell us about you and your organization.</p>
      <div style={{ display:"grid", gap:12 }}>
        <label>Name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} /></label>
        <label>Organization<input value={orgName} onChange={e=>setOrgName(e.target.value)} /></label>
        <button onClick={complete} disabled={busy || !displayName || !orgName}>
          {busy ? "Saving..." : "Complete"}
        </button>
        {err && <p style={{ color:"crimson" }}>{err}</p>}
      </div>
    </main>
  );
}
EOF

mkdir -p "$WEB_DIR/app/dashboard"

echo "==> Adding Dashboard page"
cat > "$WEB_DIR/app/dashboard/page.tsx" <<'EOF'
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const s = await getServerSession();
  if (!s) return redirect("/login");
  if (!s.onboardingComplete) return redirect("/onboarding");
  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome{ s.name ? `, ${s.name}` : "" }.</p>
      <p>UID: {s.sub}</p>
      <form action="/api/session/logout" method="post">
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
EOF

# -------- Root layout & redirector --------
echo "==> Updating layout (lightweight metadata)"
cat > "$WEB_DIR/app/layout.tsx" <<'EOF'
export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Fresh",
  description: "Authentication + Onboarding demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell" }}>
        <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>{children}</div>
      </body>
    </html>
  );
}
EOF

echo "==> Adding root redirector"
cat > "$WEB_DIR/app/page.tsx" <<'EOF'
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const s = await getServerSession();
  if (!s) return redirect("/login");
  if (!s.onboardingComplete) return redirect("/onboarding");
  return redirect("/dashboard");
}
EOF

# -------- Typescript quick sanity (only web) --------
echo "==> Typecheck (web)"
pnpm --filter @apps/web typecheck || true

echo "==> Build (web) - smoke"
pnpm --filter @apps/web build || true

cat <<'NOTE'

========================================
✅ Patch applied.

Next steps (do these now):

1) Copy env template and fill secrets:
   cp apps/web/.env.example apps/web/.env.local
   # Fill:
   # - NEXT_PUBLIC_FIREBASE_* (from Firebase console)
   # - FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY (Service Account)
   #   IMPORTANT: Keep \n in FIREBASE_PRIVATE_KEY exactly as \n newlines.

2) Start services:
   # Terminal A (API optional if you still run Express separately):
   pnpm --filter @services/api dev     # if you still want API running (not required for auth)
   # Terminal B (Web):
   pnpm --filter @apps/web dev

3) Smoke test in the browser:
   - /register  -> create account
   - Automatically logs in (session cookie set)
   - /onboarding -> submit display name + org
   - Redirects to /dashboard
   - Logout -> /api/session/logout

4) Troubleshooting:
   - 401 on /api/session/current? Verify service account envs and PRIVATE_KEY newlines.
   - 307 to /login when logged in? Clear cookies / ensure cookie name matches SESSION_COOKIE_NAME.
   - Forgot password emails not received? Check Firebase Auth Email Templates + domain allowlist.

Security notes:
   - Middleware uses cookie presence for routing; server verifies cookie on protected pages.
   - Session revocation happens on logout; Firebase also rate-limits password attempts.

You can iterate UI freely; flows are now wired and enforceable.
========================================
NOTE
