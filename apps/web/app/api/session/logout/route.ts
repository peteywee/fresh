import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  
  // Clear session cookies
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  
  response.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: false }), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  
  return response;
}
