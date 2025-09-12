import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase.admin";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";
const DAYS = Number(process.env.SESSION_COOKIE_DAYS || 5);
const EXPIRES_MS = DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  try {
    const auth = adminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });

    // Set lightweight flags cookie for middleware routing
    res.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: true }), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });
    
    return res;
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
