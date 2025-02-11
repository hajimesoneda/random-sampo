import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuthenticated = !!token

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register")
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isGuestAccess = request.nextUrl.searchParams.get("guest") === "true"

  // Allow access to public routes, API routes, and guest access to home page
  if (request.nextUrl.pathname === "/" || isApiRoute || (request.nextUrl.pathname === "/" && isGuestAccess)) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect unauthenticated users to login page for protected routes
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

