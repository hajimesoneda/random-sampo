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
      return spots.map((spot) => ({ ...spot, categoryId: category.id }))
    })

    const allSpots = (await Promise.all(spotsPromises)).flat()

    // カテゴリーごとにスポットを分類
    const spotsByCategory: { [key: string]: Spot[] } = {}
    allSpots.forEach((spot) => {
      if (!spotsByCategory[spot.categoryId]) {
        spotsByCategory[spot.categoryId] = []
      }
      spotsByCategory[spot.categoryId].push(spot)
    })

    const selectedSpots: Spot[] = []
    const availableCategories = Object.keys(spotsByCategory)

    // できるだけ多様なカテゴリーから選択
    while (selectedSpots.length < 4 && availableCategories.length > 0) {
      const categoryIndex = Math.floor(Math.random() * availableCategories.length)
      const categoryId = availableCategories[categoryIndex]
      const categorySpots = spotsByCategory[categoryId]

      if (categorySpots.length > 0) {
        const spotIndex = Math.floor(Math.random() * categorySpots.length)
        const selectedSpot = categorySpots[spotIndex]

        if (!selectedSpots.some((spot) => spot.id === selectedSpot.id)) {
          selectedSpots.push(selectedSpot)
          categorySpots.splice(spotIndex, 1)
        }

        if (categorySpots.length === 0) {
          availableCategories.splice(categoryIndex, 1)
        }
      } else {
        availableCategories.splice(categoryIndex, 1)
      }
    }

    // 4つのスポットが選択されていない場合、残りのスポットからランダムに選択
    if (selectedSpots.length < 4) {
      const remainingSpots = allSpots.filter((spot) => !selectedSpots.some((s) => s.id === spot.id))
      while (selectedSpots.length < 4 && remainingSpots.length > 0) {
        const index = Math.floor(Math.random() * remainingSpots.length)
        selectedSpots.push(remainingSpots[index])
        remainingSpots.splice(index, 1)
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

