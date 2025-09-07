import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("__session")?.value;
  if (!raw)
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }
}
