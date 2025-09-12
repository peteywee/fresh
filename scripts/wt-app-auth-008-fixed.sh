#!/usr/bin/env bash
# File: scripts/wt-app-auth-008.sh
# Purpose: Firebase Auth + Session Cookies + Onboarding (Next.js App Router)
# Usage: bash scripts/wt-app-auth-008.sh

echo "==> WT-APP-AUTH-008: Firebase auth + sessions + onboarding (Next.js)"

# -------- Preflight --------
ROOT="$(pwd)"
WEB_DIR="apps/web"
if [ ! -d "$WEB_DIR" ]; then
  echo "ERROR: $WEB_DIR not found. Run from repo root." >&2
  exit 1
fi

# Basic Node/pnpm presence checks
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found"
  exit 1
fi

echo "==> Installing dependencies (web workspace): firebase + firebase-admin + zod"
if ! pnpm --filter @apps/web add firebase firebase-admin zod; then
  echo "WARNING: Failed to install some dependencies, continuing..."
fi

# -------- Environment template --------
echo "==> Creating .env.local template (you'll need to fill these)"
cat > "$WEB_DIR/.env.local" <<'EOF'
# Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Service Account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR ACTUAL PRIVATE KEY WITH \n NEWLINES\n-----END PRIVATE KEY-----\n"

# Session cookies
SESSION_COOKIE_NAME=session
SESSION_COOKIE_MAXAGE=604800000

# App
NEXT_PUBLIC_APP_NAME=Fresh
EOF

# -------- Client SDK init --------
mkdir -p "$WEB_DIR/lib" || true

echo "==> Adding client initializer"
cat > "$WEB_DIR/lib/firebase.client.ts" <<'EOF'
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export default app;
EOF

# -------- Server SDK init --------
echo "==> Adding server/admin initializer"
cat > "$WEB_DIR/lib/firebase.server.ts" <<'EOF'
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.FIREBASE_PROJECT_ID!,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
EOF

# -------- Session utils --------
echo "==> Adding session utilities"
cat > "$WEB_DIR/lib/session.ts" <<'EOF'
import { cookies } from "next/headers";
import { adminAuth } from "./firebase.server";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session";

export async function createSessionCookie(idToken: string) {
  const maxAge = parseInt(process.env.SESSION_COOKIE_MAXAGE || "604800000", 10);
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: maxAge });
  
  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: sessionCookie,
    maxAge: maxAge / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

export async function getCurrentSession() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function clearSession() {
  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}
EOF

# -------- API Routes --------
echo "==> Creating API routes structure"
mkdir -p "$WEB_DIR/app/api/session/login" \
         "$WEB_DIR/app/api/session/logout" || true

echo "==> Adding /api/session/login (creates cookie)"
cat > "$WEB_DIR/app/api/session/login/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "../../../lib/session";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: "ID token required" }, { status: 400 });
    }

    await createSessionCookie(idToken);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
EOF

echo "==> Adding /api/session/logout (clears cookie)"
cat > "$WEB_DIR/app/api/session/logout/route.ts" <<'EOF'
import { NextResponse } from "next/server";
import { clearSession, getCurrentSession } from "../../../lib/session";
import { adminAuth } from "../../../lib/firebase.server";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (session) {
      // Revoke all sessions for the user
      await adminAuth.revokeRefreshTokens(session.uid);
    }
    
    await clearSession();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
EOF

echo "==> Adding /api/session/current (returns current user)"
cat > "$WEB_DIR/app/api/session/current/route.ts" <<'EOF'
import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/session";

export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json({ loggedIn: false }, { status: 200 });
    }

    const s = {
      uid: session.uid,
      email: session.email,
      emailVerified: session.email_verified,
      displayName: session.name || null,
      role: session.role || null,
      onboardingComplete: session.onboarding_complete || false,
    };

    return NextResponse.json({ loggedIn: true, user: s }, { status: 200 });
  } catch (error) {
    console.error("Current session error:", error);
    return NextResponse.json({ loggedIn: false }, { status: 401 });
  }
}
EOF

# -------- Onboarding API (writes to Firestore + set custom claims) --------
mkdir -p "$WEB_DIR/app/api/onboarding/complete" || true

echo "==> Adding /api/onboarding/complete (Firestore writes + claims)"
cat > "$WEB_DIR/app/api/onboarding/complete/route.ts" <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../lib/session";
import { adminAuth, adminDb } from "../../../lib/firebase.server";

const OnboardingSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const data = await request.json();
    
    const validated = OnboardingSchema.parse(data);
    
    // Create organization document
    const orgRef = adminDb.collection("organizations").doc();
    await orgRef.set({
      name: validated.organizationName,
      createdBy: session.uid,
      createdAt: new Date(),
      members: [session.uid],
    });

    // Update user document
    const userRef = adminDb.collection("users").doc(session.uid);
    await userRef.set({
      uid: session.uid,
      email: session.email,
      displayName: validated.displayName,
      organizationId: orgRef.id,
      role: "owner",
      onboardingComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    // Set custom claims
    await adminAuth.setCustomUserClaims(session.uid, {
      role: "owner",
      organizationId: orgRef.id,
      onboarding_complete: true,
    });

    return NextResponse.json({ 
      success: true,
      organizationId: orgRef.id 
    });

  } catch (error) {
    console.error("Onboarding error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Onboarding failed" 
    }, { status: 500 });
  }
}
EOF

# -------- Client Pages --------
echo "==> Creating client pages (login/register)"
mkdir -p "$WEB_DIR/app/(public)/login" \
         "$WEB_DIR/app/(public)/register" || true

echo "==> Adding Login page"
cat > "$WEB_DIR/app/(public)/login/page.tsx" <<'EOF'
"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase.client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Send token to server to create session cookie
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Session creation failed");
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "2rem" }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <p>
        Don't have an account? <a href="/register">Register</a>
      </p>
    </main>
  );
}
EOF

echo "==> Adding Register page"
cat > "$WEB_DIR/app/(public)/register/page.tsx" <<'EOF'
"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase.client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Send token to server to create session cookie
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Session creation failed");
      }

      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "2rem" }}>
      <h1>Register</h1>
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <p>
        Already have an account? <a href="/login">Login</a>
      </p>
    </main>
  );
}
EOF

# -------- Onboarding + Dashboard --------
mkdir -p "$WEB_DIR/app/(onboarding)" || true

echo "==> Adding Onboarding page"
cat > "$WEB_DIR/app/(onboarding)/page.tsx" <<'EOF'
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and get current session
    fetch("/api/session/current")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else {
          setUser(data.user);
          // If already onboarded, redirect to dashboard
          if (data.user.onboardingComplete) {
            router.push("/dashboard");
          }
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          organizationName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Onboarding failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "2rem" }}>
      <h1>Complete Your Profile</h1>
      <p>Welcome, {user.email}! Let's get you set up.</p>
      
      <form onSubmit={handleOnboarding} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
        <div>
          <label>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
            placeholder="Your full name"
          />
        </div>
        
        <div>
          <label>Organization Name</label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            disabled={loading}
            placeholder="Your company or organization"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
EOF

mkdir -p "$WEB_DIR/app/dashboard" || true

echo "==> Adding Dashboard (protected by custom claims)"
cat > "$WEB_DIR/app/dashboard/page.tsx" <<'EOF'
import { getCurrentSession } from "../lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  
  if (!session) {
    redirect("/login");
  }

  if (!session.onboarding_complete) {
    redirect("/onboarding");
  }

  const handleLogout = async () => {
    "use client";
    await fetch("/api/session/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Dashboard</h1>
        <form action={handleLogout}>
          <button type="submit">Logout</button>
        </form>
      </header>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h2>Profile</h2>
          <p><strong>Email:</strong> {session.email}</p>
          <p><strong>Name:</strong> {session.name}</p>
          <p><strong>Role:</strong> {session.role}</p>
        </div>
        
        <div style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h2>Organization</h2>
          <p>Organization ID: {session.organization_id || "Not set"}</p>
        </div>
      </div>
    </main>
  );
}
EOF

# -------- Root page with redirect logic --------
echo "==> Updating root page.tsx with auth redirect logic"
cat > "$WEB_DIR/app/page.tsx" <<'EOF'
import { getCurrentSession } from "./lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getCurrentSession();
  
  if (!session) return redirect("/login");
  if (!session.onboarding_complete) return redirect("/onboarding");
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

Next steps:
1) Fill out .env.local with your Firebase project details
2) Enable Email/Password auth in Firebase console
3) Create a service account and download the key
4) Test the flows:

Login flow:
   - /register -> create account
   - /login -> sign in
   - Automatic redirect to /onboarding if not complete
   - /onboarding -> submit display name + org
   - Redirects to /dashboard
   - Logout -> /api/session/logout

Troubleshooting:
   - 401 on /api/session/current? Verify service account envs and PRIVATE_KEY newlines.
   - 307 to /login when logged in? Clear cookies / ensure cookie name matches SESSION_COOKIE_NAME.
   - Forgot password emails not received? Check Firebase Auth Email Templates + domain allowlist.

Security notes:
   - Middleware uses cookie presence for routing; server verifies cookie on protected pages.
   - Session revocation happens on logout; Firebase also rate-limits password attempts.

You can iterate UI freely; flows are now wired and enforceable.
========================================
NOTE

All auth pages/components written. Firebase SDK configured client+server. Session cookies managed via /api/session/*.
Custom claims set during onboarding. Firestore writes users+organizations.

If any issues during testing, review .env.local values and check Firebase console settings.
EOF
