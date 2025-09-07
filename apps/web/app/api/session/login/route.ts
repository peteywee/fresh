import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(
    process.env.API_BASE_URL ?? "http://localhost:3333/api/login",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json(
      { error: "API login failed", details: e },
      { status: r.status },
    );
  }

  const data = await r.json();
  const res = NextResponse.json({ ok: true });
  // align with API response shape { user: { ... } }
  const u = (data && data.user) || {};
  res.cookies.set(
    "__session",
    JSON.stringify({
      loggedIn: true,
      onboarded: !!u.onboardingComplete,
      displayName: u.displayName || u.email,
      role: u.role,
      userId: u.id,
    }),
    {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
  return res;
}
