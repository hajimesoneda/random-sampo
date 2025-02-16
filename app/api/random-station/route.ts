import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { stations } from "@/src/db/schema"
import { sql } from "drizzle-orm"
import { fetchNearbyPlaces } from "@/lib/google-places"
import { shuffleArray } from "@/utils/array-utils"
import type { Spot } from "@/types/station"
import { getCustomCategories } from "@/lib/categories"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  console.log("Requested categories:", categories)

  try {
    const randomStations = await db.select().from(stations).orderBy(sql`RANDOM()`).limit(1)

    if (!randomStations || randomStations.length === 0) {
      console.error("No stations found in database")
      return NextResponse.json({ error: "駅が見つかりませんでした" }, { status: 404 })
    }

    const randomStation = randomStations[0]
    console.log("Selected random station:", randomStation)

    const customCategories = await getCustomCategories(1)
    const allCategories = [...categories, ...customCategories]

    // カテゴリーごとのスポットを取得
    const spotsPromises = allCategories.map(async (categoryId: string) => {
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

    // スポットの選択
    const selectedSpots: Spot[] = []

    // カテゴリーごとに1つのスポットを選択
    for (const { categoryId, spots } of results) {
      if (spots.length > 0) {
        const shuffledSpots = shuffleArray([...spots])
        const categorySpot = shuffledSpots.find(
          (spot) => !selectedSpots.some((selected) => selected.lat === spot.lat && selected.lng === spot.lng),
        )
        if (categorySpot) {
          selectedSpots.push({ ...categorySpot, type: categoryId })
        }
      }
    }

    // 残りのスロットをランダムに埋める（最大4つまで）
    const remainingSpots = results
      .flatMap(({ spots }) => spots)
      .filter((spot) => !selectedSpots.some((selected) => selected.lat === spot.lat && selected.lng === spot.lng))

    while (selectedSpots.length < 4 && remainingSpots.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingSpots.length)
      selectedSpots.push(remainingSpots[randomIndex])
      remainingSpots.splice(randomIndex, 1)
    }

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

