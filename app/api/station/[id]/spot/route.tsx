import { NextResponse } from "next/server"
import { fetchNearbyPlaces } from "@/lib/google-places"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"
import { shuffleArray } from "@/utils/array-utils"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const excludeIds = searchParams.get("exclude")?.split(",") || []

  let categories: string[] = []
  try {
    categories = categoriesParam ? JSON.parse(categoriesParam) : []
  } catch (error) {
    console.error("Failed to parse categories parameter:", error)
    return NextResponse.json({ error: "Invalid categories parameter" }, { status: 400 })
  }

  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { lat: true, lng: true },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    // カテゴリーをランダムに1つ選択
    const shuffledCategories = shuffleArray(categories)
    const selectedCategory = shuffledCategories[0]

    if (!selectedCategory) {
      return NextResponse.json({ error: "No categories available" }, { status: 400 })
    }

    // 選択されたカテゴリーの情報を取得
    const category = await prisma.category.findUnique({
      where: { id: selectedCategory },
    })

    if (!category) {
      // カスタムカテゴリーの場合
      const customCategoryPreference = await prisma.categoryPreference.findFirst({
        where: { categories: { some: { id: { in: [selectedCategory] } } } },
        select: { customCategories: true },
      })

      const customCategories: Category[] = customCategoryPreference?.customCategories
        ? (JSON.parse(customCategoryPreference.customCategories as string) as unknown[])
            .filter(isValidCategory)
            .filter((cat) => cat.id === selectedCategory)
        : []

      if (customCategories.length === 0) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
    }

    // スポットを取得
    const spots = await fetchNearbyPlaces({
      lat: station.lat,
      lng: station.lng,
      type: selectedCategory,
      radius: 1000,
    })

    // 除外IDを考慮してスポットをフィルタリング
    const availableSpots = spots.filter((spot) => !excludeIds.includes(spot.id))

    if (availableSpots.length === 0) {
      return NextResponse.json({ spot: null })
    }

    // ランダムに1つのスポットを選択
    const selectedSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)]

    return NextResponse.json({ spot: selectedSpot })
  } catch (error) {
    console.error("Error fetching spot:", error)
    return NextResponse.json(
      {
        error: "スポットの取得中にエラーが発生しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

