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
