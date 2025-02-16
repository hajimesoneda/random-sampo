import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { stations } from "@/src/db/schema"
import { sql } from "drizzle-orm"
import { fetchNearbyPlaces } from "@/lib/google-places"
import { shuffleArray } from "@/utils/array-utils"
import type { Spot } from "@/types/station"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  console.log("Requested categories:", categories)

  try {
    // Get random station with error handling
    const randomStations = await db.select().from(stations).orderBy(sql`RANDOM()`).limit(1)

    if (!randomStations || randomStations.length === 0) {
      console.error("No stations found in database")
      return NextResponse.json({ error: "駅が見つかりませんでした" }, { status: 404 })
    }

    const randomStation = randomStations[0]
    console.log("Selected random station:", randomStation)

    // カテゴリーごとのスポットを取得
    const spotsPromises = categories.map(async (categoryId: string) => {
      const spots = await fetchNearbyPlaces({
        lat: randomStation.lat,
        lng: randomStation.lng,
        type: categoryId,
        radius: 1000,
      })
      return { categoryId, spots }
    })

    const results = await Promise.all(spotsPromises)
    console.log("Fetched spots results:", JSON.stringify(results, null, 2))

    // カテゴリーごとに1つのスポットを選択
    const selectedSpots: Spot[] = []

    for (const { categoryId, spots } of results) {
      if (spots.length > 0) {
        const shuffledSpots = shuffleArray([...spots])
        // 既に選択されていない場所から1つを選択
        const uniqueSpot = shuffledSpots.find(
          (spot) => !selectedSpots.some((selected) => selected.lat === spot.lat && selected.lng === spot.lng),
        )
        if (uniqueSpot) {
          selectedSpots.push({
            ...uniqueSpot,
            type: categoryId,
          })
        }
      }
    }

    console.log("Selected spots:", JSON.stringify(selectedSpots, null, 2))

    // 最大4つまでのスポットをランダムに選択
    const finalSpots = shuffleArray(selectedSpots).slice(0, 4)

    console.log("Final spots:", JSON.stringify(finalSpots, null, 2))

    return NextResponse.json({
      id: randomStation.id,
      name: randomStation.name,
      lat: randomStation.lat,
      lng: randomStation.lng,
      lines: randomStation.lines,
      spots: finalSpots,
    })
  } catch (error) {
    console.error("Error in random-station route:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました。しばらく待ってから再度お試しください。" },
      { status: 500 },
    )
  }
}

