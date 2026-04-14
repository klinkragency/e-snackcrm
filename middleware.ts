import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const PROTECTED_PREFIXES = ["/clients", "/settings", "/containers"]
const API_PROTECTED_PREFIXES = ["/api/clients", "/api/admins", "/api/containers"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPage = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isProtectedApi = API_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next()
  }

  // Reads the Better Auth session cookie without verifying server-side —
  // a cheap optimistic check. Server routes re-validate properly via auth.api.getSession.
  const sessionCookie = getSessionCookie(request)
  if (!sessionCookie) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/clients/:path*",
    "/settings/:path*",
    "/containers/:path*",
    "/api/clients/:path*",
    "/api/admins/:path*",
    "/api/containers/:path*",
  ],
}
