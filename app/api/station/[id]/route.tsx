import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { eq, inArray } from "drizzle-orm"
import { stations, categories, categoryPreferences } from "@/src/db/schema"
import { fetchNearbyPlaces } from "@/lib/google-places"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"
import { shuffleArray } from "@/utils/array-utils"

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
    const spots = await fetchSpots(station.lat, station.lng, allCategories)

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

async function fetchSpots(lat: number, lng: number, categories: Category[]) {
  // 各カテゴリーごとのスポット取得を並行実行
  const spotsPromises = categories.map(async (category) => {
    try {
      const spots = await fetchNearbyPlaces({
        lat,
        lng,
        type: category.id,
        radius: 1000,
      })

      if (spots.length === 0) {
        console.warn(`No spots found for category: ${category.label}`)
      } else {
        console.log(`Found ${spots.length} spots for category: ${category.label}`)
      }

      return spots.map((spot) => ({ ...spot, type: category.id }))
    } catch (error) {
      console.error(`Error fetching spots for category ${category.label}:`, error)
      return []
    }
  })

  try {
    const spotsArrays = await Promise.all(spotsPromises)
    const allSpots = spotsArrays.flat()

    if (allSpots.length === 0) {
      console.warn("No spots found for any category")
      return []
    }

    // カテゴリーごとに最低1つのスポットを確保しようとする
    const spotsByCategory = new Map<string, any[]>()
    allSpots.forEach((spot) => {
      if (!spotsByCategory.has(spot.type)) {
        spotsByCategory.set(spot.type, [])
      }
      spotsByCategory.get(spot.type)?.push(spot)
    })

    // 各カテゴリーから1つずつスポットを選択
    const selectedSpots: any[] = []
    spotsByCategory.forEach((spots, category) => {
      if (spots.length > 0) {
        selectedSpots.push(spots[Math.floor(Math.random() * spots.length)])
      }
    })

    // 残りのスロットを埋める
    const remainingSpots = allSpots.filter((spot) => !selectedSpots.some((selected) => selected.id === spot.id))

    while (selectedSpots.length < 4 && remainingSpots.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingSpots.length)
      const candidateSpot = remainingSpots[randomIndex]

      // 同じ位置のスポットが既に選択されていないか確認
      if (!selectedSpots.some((spot) => spot.lat === candidateSpot.lat && spot.lng === candidateSpot.lng)) {
        selectedSpots.push(candidateSpot)
      }

      remainingSpots.splice(randomIndex, 1)
    }

    // 4つに満たない場合、既に選択されたカテゴリーからランダムに追加
    while (selectedSpots.length < 4) {
      const randomCategorySpots =
        spotsByCategory.get(categories[Math.floor(Math.random() * categories.length)].id) || []
      if (randomCategorySpots.length > 0) {
        const additionalSpot = randomCategorySpots[Math.floor(Math.random() * randomCategorySpots.length)]
        if (!selectedSpots.some((spot) => spot.id === additionalSpot.id)) {
          selectedSpots.push(additionalSpot)
        }
      }
    }

    return shuffleArray(selectedSpots)
  } catch (error) {
    console.error("Error processing spots:", error)
    return []
  }
}

