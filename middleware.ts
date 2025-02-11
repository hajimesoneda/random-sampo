import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Allow guest access to the main page
    if (req.nextUrl.pathname === "/") {
      return NextResponse.next()
    }

    // Allow access to login and register pages
    if (["/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.next()
    }

    // For all other routes, ensure the user is authenticated
    if (!req.nextauth.token && !req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
)

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}

