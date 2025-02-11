import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    // Allow guest access to the main page
    if (req.nextUrl.pathname === "/") {
      return NextResponse.next()
    }

    // Allow access to login and register pages
    if (["/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.next()
    }

    // Check if user is authenticated for protected routes
    const token = req.nextauth.token
    if (!token && !req.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true to allow the middleware to handle the logic above
        return true
      },
    },
  },
)

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}

