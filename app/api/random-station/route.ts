import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { stations } from "@/src/db/schema"
import { sql } from "drizzle-orm"
import { fetchNearbyPlaces } from "@/lib/google-places"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    // Get random station with error handling
    const randomStations = await db.select().from(stations).orderBy(sql`RANDOM()`).limit(1)

    if (!randomStations || randomStations.length === 0) {
      console.error("No stations found in database")
      return NextResponse.json({ error: "駅が見つかりませんでした" }, { status: 404 })
    }

    const randomStation = randomStations[0]

    // Fetch spots for each category
    const spotsPromises = categories.map(async (category: string) => {
      const spots = await fetchNearbyPlaces({
        lat: randomStation.lat,
        lng: randomStation.lng,
        type: category,
        radius: 1000, // 1km radius
      })
      return spots.map((spot) => ({ ...spot, type: category }))
    })

    const spotsArrays = await Promise.all(spotsPromises)
    const spots = spotsArrays.flat().slice(0, 4) // Limit to 4 spots total

    return NextResponse.json({
      id: randomStation.id,
      name: randomStation.name,
      lat: randomStation.lat,
      lng: randomStation.lng,
      lines: randomStation.lines,
      spots: spots,
    })
  } catch (error) {
    console.error("Error in random-station route:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。しばらく待ってから再度お試しください。" },
      { status: 500 },
    )
  }
}

