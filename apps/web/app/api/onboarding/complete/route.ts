import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const r = await fetch(
    process.env.API_BASE_URL ?? "http://localhost:3001/api/onboarding/complete",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json(
      { error: "API failed", details: e },
      { status: 502 },
    );
  }
  const data = await r.json();

  const session = {
    loggedIn: true,
    onboarded: true,
    displayName: data?.user?.displayName,
    orgName: data?.org?.name,
  };
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", JSON.stringify(session), {
    httpOnly: true,
    path: "/",
  });
  return res;
}
