// Next.js 16 renamed `middleware` → `proxy`. Same conventions, new filename.
// We use this as a cheap optimistic check: if there's no admin session cookie,
// redirect to /admin/login before hitting the page. The page itself still does
// the real iron-session verification via getAdminSession().

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionOptions } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself + its API route.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth/")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(sessionOptions.cookieName);
  if (!sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
