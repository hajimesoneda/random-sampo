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

    // カテゴリーごとにスポットを取得
    const categorySpots = await Promise.all(
      allCategories.map(async (category) => {
        const spots = await fetchNearbyPlaces({
          lat: station.lat,
          lng: station.lng,
          type: category.id,
          radius: 1000,
        })
        return {
          categoryId: category.id,
          spots: spots,
        }
      }),
    )

    // 有効なスポットがあるカテゴリーのみをフィルタリング
    const validCategories = categorySpots.filter((category) => category.spots.length > 0)

    if (validCategories.length === 0) {
      return NextResponse.json({ spots: [] })
    }

    // スポット選択アルゴリズム
    const selectedSpots: Spot[] = []
    const maxSpots = 4

    // Step 1: 各カテゴリーから最低1つのスポットを選択（可能な場合）
    const shuffledCategories = shuffleArray([...validCategories])
    for (const category of shuffledCategories) {
      if (selectedSpots.length >= maxSpots) break

      const availableSpots = category.spots.filter((spot) => !selectedSpots.some((selected) => selected.id === spot.id))
      if (availableSpots.length > 0) {
        const randomSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)]
        selectedSpots.push(randomSpot)
      }
    }

    // Step 2: 残りのスロットを埋める（カテゴリーの重複を最小限に）
    const remainingSlots = maxSpots - selectedSpots.length
    if (remainingSlots > 0) {
      // 使用済みのカテゴリーを追跡
      const usedCategories = new Set(selectedSpots.map((spot) => spot.type))

      // 未使用のカテゴリーを優先
      const remainingSpots = validCategories
        .flatMap((category) => category.spots)
        .filter((spot) => !selectedSpots.some((selected) => selected.id === spot.id))

      const prioritizedSpots = shuffleArray(remainingSpots).sort((a, b) => {
        const aUsed = usedCategories.has(a.type)
        const bUsed = usedCategories.has(b.type)
        if (aUsed && !bUsed) return 1
        if (!aUsed && bUsed) return -1
        return 0
      })

      for (const spot of prioritizedSpots) {
        if (selectedSpots.length >= maxSpots) break
        if (!selectedSpots.some((selected) => selected.id === spot.id)) {
          selectedSpots.push(spot)
          usedCategories.add(spot.type)
        }
      }
    }

    // 最終的なスポットリストをシャッフル
    const finalSpots = shuffleArray(selectedSpots)

    return NextResponse.json({ spots: finalSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "スポットの取得中にエラーが発生しました。" }, { status: 500 })
  }
}

