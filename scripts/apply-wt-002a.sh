#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating logout route in web app..."
mkdir -p apps/web/app/api/session/logout
cat > apps/web/app/api/session/logout/route.ts <<'EOF'
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Logged out" });
  res.cookies.set("__session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
EOF

echo "==> Updating dashboard to include logout button..."
cat > apps/web/app/dashboard/page.tsx <<'EOF'
"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function fetchSession() {
      const res = await fetch("/api/session/get");
      if (res.ok) {
        setSession(await res.json());
      } else {
        window.location.href = "/login";
      }
    }
    fetchSession();
  }, []);

  async function logout() {
    await fetch("/api/session/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!session) return <p>Loading...</p>;

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {session.displayName ?? "User"}!</p>
      <p>Your role: {session.role ?? "unknown"}</p>
      {session.role === "manager" && <p>You have manager-level access.</p>}
      {session.role === "user" && <p>You have user-level access.</p>}
      <button onClick={logout} style={{ marginTop: "16px", padding: "8px 16px" }}>
        Logout
      </button>
    </main>
  );
}
EOF

echo "==> Creating helper route to read session JSON..."
mkdir -p apps/web/app/api/session/get
cat > apps/web/app/api/session/get/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("__session")?.value;
  if (!raw) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
}
EOF

echo "==> Done. Logout enabled."
