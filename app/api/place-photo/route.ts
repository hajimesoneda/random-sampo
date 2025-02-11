import { NextResponse } from "next/server"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      console.error("Photo reference is missing")
      return NextResponse.json({ error: "Photo reference is required" }, { status: 400 })
    }

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${reference}&key=${GOOGLE_MAPS_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch photo: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch photo: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const headers = new Headers(response.headers)
    headers.set("Cache-Control", "public, max-age=31536000") // Cache for 1 year

    return new NextResponse(buffer, {
      headers,
      status: 200,
    })
  } catch (error) {
    console.error("Error fetching place photo:", error)
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 })
  }
}

