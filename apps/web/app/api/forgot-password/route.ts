import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email)
    return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const r = await fetch(
    process.env.API_BASE_URL ?? "http://localhost:3333/api/forgot-password",
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
  return NextResponse.json(await r.json());
}
