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

  let categories: string[] = []
  try {
    categories = categoriesParam ? JSON.parse(categoriesParam) : []
  } catch (error) {
    console.error("Failed to parse categories parameter:", error)
    return NextResponse.json({ error: "Invalid categories parameter" }, { status: 400 })
  }

  try {
    console.log(`Fetching spots for station ${stationId} with categories:`, categories)

    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { lat: true, lng: true },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    // カテゴリー情報の取得
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

    console.log("Processing categories:", allCategories)

    // 各カテゴリーから1つずつスポットを取得
    const categorySpots = await Promise.all(
      allCategories.map(async (category) => {
        try {
          const spots = await fetchNearbyPlaces({
            lat: station.lat,
            lng: station.lng,
            type: category.id,
            radius: 1000,
          })

          if (spots && spots.length > 0) {
            // 各カテゴリーからランダムに1つのスポットを選択
            const randomSpot = spots[Math.floor(Math.random() * spots.length)]
            return {
              categoryId: category.id,
              spot: randomSpot,
            }
          }
        } catch (error) {
          console.error(`Error fetching spots for category ${category.id}:`, error)
        }
        return null
      }),
    )

    // nullを除外し、有効なスポットのみを取得
    const validSpots = categorySpots
      .filter((item): item is { categoryId: string; spot: Spot } => item !== null && item.spot !== undefined)
      .map((item) => item.spot)

    console.log(`Found ${validSpots.length} valid spots across all categories`)

    if (validSpots.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // 取得したスポットをシャッフルし、最大4つを選択
    const selectedSpots = shuffleArray(validSpots).slice(0, 4)
    console.log(`Selected ${selectedSpots.length} spots to display`)

    return NextResponse.json({ spots: selectedSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json(
      {
        error: "スポットの取得中にエラーが発生しました。",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

