/**
 * Next.js 16 Proxy — lightweight cookie-existence check.
 * Runs as a network boundary handler so unauthenticated visitors are
 * redirected to /login instantly without starting a serverless function.
 *
 * NO fetch / API call / JWT verification here; server components and
 * API routes handle full session validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { DEV_STATIC_ASSET_PREFIX } from "@/lib/vercel/dev-static-prefix";

const PUBLIC = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith(DEV_STATIC_ASSET_PREFIX) ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC.has(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session_id")?.value;
  if (!session || session === "null" || session === "undefined") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher must be a string literal (Next.js statically analyzes it).
  // `__dev-static` is DEV_STATIC_ASSET_PREFIX — keep in sync.
  matcher: [
    "/((?!api|_next/static|_next/image|__dev-static|favicon\\.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.woff|.*\\.woff2).*)",
  ],
};
