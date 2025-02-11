import { NextResponse } from "next/server"
import { fetchNearbyPlaces } from "@/lib/google-places"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"
import type { Spot } from "@/types/station"
import { shuffleArray } from "@/utils/array-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories: string[] = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    console.log(`Fetching spots for station ${stationId} with categories:`, categories)

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { lat: true, lng: true },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    const dbCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    })

    const customCategoriesResult = await prisma.categoryPreference.findFirst({
      where: { categories: { some: { id: { in: categories } } } },
      select: { customCategories: true },
    })

    const customCategories: Category[] = customCategoriesResult?.customCategories
      ? (JSON.parse(customCategoriesResult.customCategories as string) as unknown[])
          .filter(isValidCategory)
          .filter((cat) => categories.includes(cat.id))
      : []

    const allCategories: Category[] = [
      ...dbCategories.map((cat) => ({
        ...cat,
        type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      })),
      ...customCategories,
    ]

    console.log("Fetching spots for categories:", allCategories)

    // カテゴリーごとのスポットを取得
    const spotsPromises = allCategories.map(async (category) => {
      const spots = await fetchNearbyPlaces({
        lat: station.lat,
        lng: station.lng,
        type: category.id,
        radius: 1000,
      })
      return { categoryId: category.id, spots }
    })

    const results = await Promise.all(spotsPromises)
    const validResults = results.filter((result) => result.spots.length > 0)

    if (validResults.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // ここからがシャッフルと選択のロジック
    const selectedSpots: Spot[] = []

    // 1. まず、各カテゴリーの結果をシャッフル
    const shuffledCategories = shuffleArray([...validResults])

    // 2. 各カテゴリーから最低1つのスポットを選択（可能な場合）
    for (const category of shuffledCategories) {
      if (selectedSpots.length >= 4) break

      const shuffledSpots = shuffleArray([...category.spots])
      const spot = shuffledSpots[0]

      if (spot && !selectedSpots.some((s) => s.id === spot.id)) {
        selectedSpots.push(spot)
      }
    }

    // 3. まだ4つに満たない場合、残りのスポットからランダムに追加
    if (selectedSpots.length < 4) {
      const remainingSpots = shuffledCategories
        .flatMap((category) => category.spots)
        .filter((spot) => !selectedSpots.some((s) => s.id === spot.id))

      const shuffledRemaining = shuffleArray(remainingSpots)

      for (const spot of shuffledRemaining) {
        if (selectedSpots.length >= 4) break
        if (!selectedSpots.some((s) => s.id === spot.id)) {
          selectedSpots.push(spot)
        }
      }
    }

    // 4. 最終的な結果をシャッフル
    const finalSpots = shuffleArray(selectedSpots)

    return NextResponse.json({ spots: finalSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "スポットの取得中にエラーが発生しました。" }, { status: 500 })
  }
}

