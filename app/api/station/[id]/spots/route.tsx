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

    const spotsPromises = allCategories.map(async (category) => {
      const spots = await fetchNearbyPlaces({
        lat: station.lat,
        lng: station.lng,
        type: category.id,
        radius: 1000,
      })
      return { category, spots }
    })

    const categoryResults = await Promise.all(spotsPromises)

    // カテゴリーごとのスポットを保持
    const spotsByCategory: { [key: string]: Spot[] } = {}
    categoryResults.forEach(({ category, spots }) => {
      if (spots.length > 0) {
        spotsByCategory[category.id] = spots
      }
    })

    const selectedSpots: Spot[] = []
    const categoryIds = Object.keys(spotsByCategory)

    // 各カテゴリーから1つずつスポットを選択
    while (selectedSpots.length < 4 && categoryIds.length > 0) {
      for (let i = 0; i < categoryIds.length && selectedSpots.length < 4; i++) {
        const categoryId = categoryIds[i]
        if (spotsByCategory[categoryId].length > 0) {
          const randomIndex = Math.floor(Math.random() * spotsByCategory[categoryId].length)
          const spot = spotsByCategory[categoryId][randomIndex]
          if (!selectedSpots.some((s) => s.lat === spot.lat && s.lng === spot.lng)) {
            selectedSpots.push(spot)
            spotsByCategory[categoryId].splice(randomIndex, 1)
          }
        }
        if (spotsByCategory[categoryId].length === 0) {
          categoryIds.splice(i, 1)
          i--
        }
      }
    }

    // 選択されたスポットの順番をシャッフル
    const shuffledSpots = shuffleArray(selectedSpots)

    return NextResponse.json({ spots: shuffledSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

