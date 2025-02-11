import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { eq, inArray } from "drizzle-orm"
import { stations, categories, categoryPreferences } from "@/src/db/schema"
import { fetchNearbyPlaces } from "@/lib/google-places"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categoryIds: string[] = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    const stationResult = await db.select().from(stations).where(eq(stations.id, stationId)).limit(1)

    if (stationResult.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    const station = stationResult[0]

    // Fetch categories from the database
    const dbCategories = await db.select().from(categories).where(inArray(categories.id, categoryIds))

    // Fetch custom categories from user preferences
    const customCategoriesResult = await db
      .select({ customCategories: categoryPreferences.customCategories })
      .from(categoryPreferences)
      .where(eq(categoryPreferences.userId, 1)) // Assuming user ID 1 for now
      .limit(1)

    // Parse and validate custom categories
    const customCategories: Category[] = customCategoriesResult[0]?.customCategories
      ? (JSON.parse(customCategoriesResult[0].customCategories as string) as any[])
          .filter(isValidCategory)
          .filter((cat) => categoryIds.includes(cat.id))
      : []

    // Combine database categories and custom categories
    const allCategories: Category[] = [
      ...dbCategories.map((cat) => ({
        ...cat,
        type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      })),
      ...customCategories,
    ]

    // Fetch spots for the station with category distribution
    const spots = await fetchSpotsWithDistribution(station.lat, station.lng, allCategories)

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

async function fetchSpotsWithDistribution(lat: number, lng: number, categories: Category[]) {
  // カテゴリーごとのスポット取得を並行実行
  const spotsPromises = categories.map(async (category) => {
    const spots = await fetchNearbyPlaces({
      lat,
      lng,
      type: category.id,
      radius: 1000, // 1km radius
    })
    return spots.map((spot) => ({ ...spot, type: category.label }))
  })

  try {
    const spotsArrays = await Promise.all(spotsPromises)

    // カテゴリーごとの結果を確認
    spotsArrays.forEach((spots, index) => {
      console.log(`Category ${categories[index].label}: found ${spots.length} spots`)
    })

    // 各カテゴリーから少なくとも1つのスポットを確保しつつ、
    // 合計で最大4つになるように調整
    let distributedSpots: any[] = []
    let remainingSpots: any[] = []

    spotsArrays.forEach((categorySpots, index) => {
      if (categorySpots.length > 0) {
        // 各カテゴリーから1つ目のスポットを追加
        distributedSpots.push(categorySpots[0])
        // 残りのスポットは後で使用するために保存
        if (categorySpots.length > 1) {
          remainingSpots = remainingSpots.concat(categorySpots.slice(1))
        }
      }
    })

    // もし4つに満たない場合、残りのスポットからランダムに追加
    if (distributedSpots.length < 4 && remainingSpots.length > 0) {
      const shuffledRemaining = shuffleArray(remainingSpots)
      distributedSpots = distributedSpots.concat(shuffledRemaining.slice(0, 4 - distributedSpots.length))
    }

    // 結果をシャッフルして返す
    return shuffleArray(distributedSpots)
  } catch (error) {
    console.error("Error fetching spots:", error)
    return []
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

