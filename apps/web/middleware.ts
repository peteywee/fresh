import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/health",
  "/api/status",
  "/api/login",
  "/api/register",
  "/api/forgot-password",
  "/api/reset-password",
  "/favicon.ico",
]);

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/assets")
  );
}

// TODO: replace with real session detection when cookies are implemented
function hasSession(_req: NextRequest): boolean {
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Always let static and public paths through
  if (isAsset(pathname) || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Only gate real app areas; keep public flows open
  const requiresAuth =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/app");

  if (requiresAuth && !hasSession(req)) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Match everything that isn't an actual file (has a dot)
export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
