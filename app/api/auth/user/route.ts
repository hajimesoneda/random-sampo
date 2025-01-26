import { NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 })
  }

  const token = authHeader.split(" ")[1]
  const user = getUserFromToken(token)

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  return NextResponse.json({ user })
}

