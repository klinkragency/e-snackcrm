import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// ── Friend's existing routes ──
const EXISTING_PROTECTED_PAGES = ["/clients", "/settings", "/containers"]
const EXISTING_PROTECTED_API = ["/api/clients", "/api/admins", "/api/containers"]

// ── CRM affiliate routes ──
const CRM_PROTECTED_PAGES = ["/dashboard", "/admin"]
const CRM_PROTECTED_API = ["/api/crm"]

// ── Public routes (no auth) ──
const PUBLIC_ROUTES = ["/join", "/profil", "/auth"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const isProtectedPage =
    EXISTING_PROTECTED_PAGES.some((p) => pathname.startsWith(p)) ||
    CRM_PROTECTED_PAGES.some((p) => pathname.startsWith(p))

  const isProtectedApi =
    EXISTING_PROTECTED_API.some((p) => pathname.startsWith(p)) ||
    CRM_PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next()
  }

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
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/crm/:path*",
    "/join/:path*",
    "/profil/:path*",
    "/auth/:path*",
  ],
}
