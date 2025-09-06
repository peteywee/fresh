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
