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

    // 各カテゴリーから1つずつスポットを取得
    const spotsByCategory = await Promise.all(
      allCategories.map(async (category) => {
        const spots = await fetchNearbyPlaces({
          lat: station.lat,
          lng: station.lng,
          type: category.id,
          radius: 1000,
        })

        if (spots.length > 0) {
          // 各カテゴリーからランダムに1つのスポットを選択
          const randomSpot = spots[Math.floor(Math.random() * spots.length)]
          return {
            categoryId: category.id,
            spot: randomSpot,
          }
        }
        return null
      }),
    )

    // nullを除外し、有効なスポットのみを取得
    const validSpots = spotsByCategory
      .filter((item): item is { categoryId: string; spot: Spot } => item !== null)
      .map((item) => item.spot)

    if (validSpots.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // 取得したスポットをシャッフルし、最大4つを選択
    const selectedSpots = shuffleArray(validSpots).slice(0, 4)

    return NextResponse.json({ spots: selectedSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "スポットの取得中にエラーが発生しました。" }, { status: 500 })
  }
}

