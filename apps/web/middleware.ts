import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const sessionRaw = req.cookies.get("__session")?.value;

  let session: any = null;
  try { session = sessionRaw ? JSON.parse(sessionRaw) : null; } catch {}

  const isPublic = path.startsWith("/login") || path.startsWith("/api/session");
  if (isPublic) return NextResponse.next();

  const loggedIn = !!session?.loggedIn;
  const onboarded = !!session?.onboarded;

  if (!loggedIn && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (loggedIn && !onboarded && !path.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
  if (loggedIn && onboarded && (path === "/" || path === "/login" || path === "/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/session).*)"]
};
