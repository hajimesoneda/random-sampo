import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { stations } from "@/src/db/schema"
import { sql } from "drizzle-orm"
import { fetchNearbyPlaces } from "@/lib/google-places"
import { shuffleArray } from "@/utils/array-utils"

// 座標の重複を確認する関数
function isUniqueLocation(spot: any, selectedSpots: any[]): boolean {
  return !selectedSpots.some(
    (selected) => Math.abs(selected.lat - spot.lat) < 0.0001 && Math.abs(selected.lng - spot.lng) < 0.0001,
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
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

    // すべてのスポットを1つの配列にまとめる
    const allSpots = validResults.flatMap(({ categoryId, spots }) =>
      spots.map((spot) => ({ ...spot, type: categoryId })),
    )

    // スポットをシャッフルして、重複をチェックしながら最大4つを選択
    const selectedSpots: any[] = []
    const shuffledSpots = shuffleArray(allSpots)

    for (const spot of shuffledSpots) {
      if (selectedSpots.length >= 4) break
      if (isUniqueLocation(spot, selectedSpots)) {
        selectedSpots.push(spot)
      }
    }

    // スポットが4つに満たない場合、ランダムなスポットを追加
    while (selectedSpots.length < 4) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      const randomSpot = await fetchNearbyPlaces({
        lat: randomStation.lat,
        lng: randomStation.lng,
        type: randomCategory,
        radius: 1000,
      })
      if (randomSpot.length > 0) {
        const spot = randomSpot[0]
        if (isUniqueLocation(spot, selectedSpots)) {
          selectedSpots.push({ ...spot, type: randomCategory })
        }
      }
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

