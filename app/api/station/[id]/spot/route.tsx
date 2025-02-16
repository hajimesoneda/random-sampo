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
    const spotsByCategory = await fetchNearbyPlaces({
      lat: station.lat,
      lng: station.lng,
      types: allCategories.map((category) => category.id),
    })

    const validResults = Object.entries(spotsByCategory).filter(([_, spots]) => spots.length > 0)

    if (validResults.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // カテゴリーごとに1つのスポットを選択
    const selectedSpots: Spot[] = []

    // 各カテゴリーからランダムに1つのスポットを選択
    for (const [categoryId, spots] of validResults) {
      const shuffledSpots = shuffleArray([...spots])
      const spot = shuffledSpots[0]
      if (spot) {
        selectedSpots.push({
          ...spot,
          type: categoryId, // カテゴリーIDを設定
        })
      }
    }

    // 最終的な結果をシャッフル
    const finalSpots = shuffleArray(selectedSpots)

    return NextResponse.json({ spots: finalSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "スポットの取得中にエラーが発生しました。" }, { status: 500 })
  }
}

