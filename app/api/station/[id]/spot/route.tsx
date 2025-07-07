import { NextResponse } from "next/server"
import { fetchNearbyPlaces } from "@/lib/google-places"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"
import { shuffleArray } from "@/utils/array-utils"

// 座標の重複を確認する関数
function isUniqueLocation(spot: any, selectedSpots: any[]): boolean {
  return !selectedSpots.some(
    (selected) => Math.abs(selected.lat - spot.lat) < 0.0001 && Math.abs(selected.lng - spot.lng) < 0.0001,
  )
}

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
      return spots.map((spot) => ({ ...spot, type: category.id }))
    })

    const spotsResults = await Promise.all(spotsPromises)
    const allSpots = spotsResults.flat()

    if (allSpots.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // 重複をチェックしながらスポットを選択
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
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)]
      const randomSpot = await fetchNearbyPlaces({
        lat: station.lat,
        lng: station.lng,
        type: randomCategory.id,
        radius: 1000,
      })
      if (randomSpot.length > 0) {
        const spot = randomSpot[0]
        if (isUniqueLocation(spot, selectedSpots)) {
          selectedSpots.push({ ...spot, type: randomCategory.id })
        }
      }
    }

    return NextResponse.json({ spots: selectedSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "スポットの取得中にエラーが発生しました。" }, { status: 500 })
  }
}

