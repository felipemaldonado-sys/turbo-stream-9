import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_BASIC_USER =
  process.env.ADMIN_BASIC_USER && process.env.ADMIN_BASIC_USER.trim().length > 0
    ? process.env.ADMIN_BASIC_USER.trim()
    : "rappiturbostream";
const ADMIN_BASIC_PASS =
  process.env.ADMIN_BASIC_PASS && process.env.ADMIN_BASIC_PASS.trim().length > 0
    ? process.env.ADMIN_BASIC_PASS.trim()
    : "turbocastr.io";
const BASIC_AUTH_REALM = "Turbo Stream Admin";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });
}

function parseBasicAuthHeader(header: string | null): { user: string; pass: string } | null {
  if (!header || !header.startsWith("Basic ")) return null;
  const base64 = header.slice(6).trim();
  if (!base64) return null;

  try {
    const decoded = atob(base64);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      user: decoded.slice(0, separator),
      pass: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function isAuthorized(request: NextRequest): boolean {
  const parsed = parseBasicAuthHeader(request.headers.get("authorization"));
  return Boolean(parsed && parsed.user === ADMIN_BASIC_USER && parsed.pass === ADMIN_BASIC_PASS);
}

export function middleware(request: NextRequest) {
  if (isAuthorized(request)) {
    return NextResponse.next();
  }
  return unauthorizedResponse();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/configure",
    "/configure/:path*",
    "/api/admin/:path*",
    "/api/cameras",
    "/api/cameras/:path*",
  ],
};
