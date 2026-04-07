import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * TODO: Proteger /admin con autenticación (NextAuth, Clerk, sesión JWT, etc.).
 * Ejemplo:
 *   const token = request.cookies.get("session");
 *   if (!token) return NextResponse.redirect(new URL("/login", request.url));
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/configure", "/configure/:path*"],
};
