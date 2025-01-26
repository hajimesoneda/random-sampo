import { NextResponse } from "next/server"
import { loginUser } from "@/lib/auth"

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  const token = await loginUser(email, password)

  if (!token) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  return NextResponse.json({ token })
}

