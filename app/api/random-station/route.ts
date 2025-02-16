import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { stations } from "@/src/db/schema"
import { sql } from "drizzle-orm"
import { fetchNearbyPlaces } from "@/lib/google-places"
import { shuffleArray } from "@/utils/array-utils"

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

    // カテゴリーごとのスポットを取得
    const spotsPromises = categories.map(async (category: string) => {
      const spots = await fetchNearbyPlaces({
        lat: randomStation.lat,
        lng: randomStation.lng,
        type: category,
        radius: 1000,
      })
      return { categoryId: category, spots }
    })

    const results = await Promise.all(spotsPromises)
    const validResults = results.filter((result) => result.spots.length > 0)

    // カテゴリーごとに1つのスポットを選択
    const selectedSpots = validResults
      .map(({ categoryId, spots }) => {
        const shuffledSpots = shuffleArray([...spots])
        const spot = shuffledSpots[0]
        return spot ? { ...spot, type: categoryId } : null
      })
      .filter((spot): spot is NonNullable<typeof spot> => spot !== null)

    return NextResponse.json({
      id: randomStation.id,
      name: randomStation.name,
      lat: randomStation.lat,
      lng: randomStation.lng,
      lines: randomStation.lines,
      spots: selectedSpots,
    })
  } catch (error) {
    console.error("Error in random-station route:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。しばらく待ってから再度お試しください。" },
      { status: 500 },
    )
  }
}

