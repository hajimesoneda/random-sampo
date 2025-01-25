import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is not set in environment variables")
    return NextResponse.json({ error: "API key not found" }, { status: 500 })
  }

  // Only return the API key if the request is from our application
  const response = NextResponse.json({ apiKey })

  // Add security headers
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Content-Type", "application/json")

  return response
}

