import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { eq } from "drizzle-orm"
import { stations } from "@/src/db/schema"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    const stationResult = await db.select().from(stations).where(eq(stations.id, stationId)).limit(1)

    if (stationResult.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    const station = stationResult[0]

    // Fetch spots for the station (you may need to adjust this based on your data structure)
    const spots = await fetchSpots(stationId, categories)

    return NextResponse.json({
      id: station.id,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      lines: station.lines,
      spots: spots,
    })
  } catch (error) {
    console.error("Error fetching station:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function fetchSpots(stationId: string, categories: string[]) {
  // Implement spot fetching logic here
  // This is a placeholder and should be replaced with actual spot fetching logic
  return []
}

