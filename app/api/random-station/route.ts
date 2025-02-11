import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { sql } from "drizzle-orm"
import { stations } from "@/src/db/schema"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    const randomStations = await db.select().from(stations).orderBy(sql`RANDOM()`).limit(1)

    if (randomStations.length === 0) {
      return NextResponse.json({ error: "No stations found" }, { status: 404 })
    }

    const randomStation = randomStations[0]

    // Fetch spots for the station (you may need to adjust this based on your data structure)
    const spots = await fetchSpots(randomStation.id, categories)

    return NextResponse.json({
      id: randomStation.id,
      name: randomStation.name,
      lat: randomStation.lat,
      lng: randomStation.lng,
      lines: randomStation.lines,
      spots: spots,
    })
  } catch (error) {
    console.error("Error fetching random station:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function fetchSpots(stationId: string, categories: string[]) {
  // Implement spot fetching logic here
  // This is a placeholder and should be replaced with actual spot fetching logic
  return []
}

