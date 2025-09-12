import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Public or static resources - include all auth-related pages
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    /\.[\w]+$/.test(pathname); // static files

  // NEVER intercept API
  const isAPI = pathname.startsWith("/api");
  if (isPublic || isAPI) return NextResponse.next();

  // Session cookie - use the flags cookie for routing decisions
  const flagsCookie = process.env.FLAGS_COOKIE_NAME || "fresh_flags";
  const raw = req.cookies.get(flagsCookie)?.value;
  let flags: any = null;
  try { flags = raw ? JSON.parse(raw) : null; } catch {}

  const loggedIn = !!flags?.li;
  const onboarded = !!flags?.ob;

  if (!loggedIn)
    return NextResponse.redirect(new URL("/login", req.url));

  if (loggedIn && !onboarded && !pathname.startsWith("/onboarding"))
    return NextResponse.redirect(new URL("/onboarding", req.url));

  if (loggedIn && onboarded && (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/onboarding"))
    return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"]
};
