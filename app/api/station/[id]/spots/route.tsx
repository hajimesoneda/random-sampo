import { NextResponse } from "next/server"
import { fetchNearbyPlaces } from "@/lib/google-places"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"
import type { Spot } from "@/types/station"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories: string[] = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    // Get station coordinates from the database
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { lat: true, lng: true },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    // Fetch categories from the database
    const dbCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    })

    // Fetch custom categories from user preferences
    const customCategoriesResult = await prisma.categoryPreference.findFirst({
      where: { categories: { some: { id: { in: categories } } } },
      select: { customCategories: true },
    })

    // Parse and validate custom categories
    const customCategories: Category[] = customCategoriesResult?.customCategories
      ? (JSON.parse(customCategoriesResult.customCategories as string) as unknown[])
          .filter(isValidCategory)
          .filter((cat) => categories.includes(cat.id))
      : []

    // Combine database categories and custom categories
    const allCategories: Category[] = [
      ...dbCategories.map((cat) => ({
        ...cat,
        type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      })),
      ...customCategories,
    ]

    // Fetch spots for each category in parallel
    const spotsPromises = allCategories.map(async (category) => {
      const spots = await fetchNearbyPlaces({
        lat: station.lat,
        lng: station.lng,
        type: category.id,
        radius: 1000, // 1km radius
      })
      return { category, spots }
    })

    const categoryResults = await Promise.all(spotsPromises)

    // Ensure at least one spot from each category if available
    const selectedSpots: Spot[] = []
    const remainingSpots: Spot[] = []

    // First pass: Select one spot from each category
    for (const { category, spots } of categoryResults) {
      if (spots.length > 0) {
        // Randomly select one spot from this category
        const randomIndex = Math.floor(Math.random() * spots.length)
        selectedSpots.push(spots[randomIndex])
        // Add remaining spots to the pool
        remainingSpots.push(...spots.slice(0, randomIndex), ...spots.slice(randomIndex + 1))
      }
    }

    // Second pass: Fill remaining slots randomly from the pool
    while (selectedSpots.length < 4 && remainingSpots.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingSpots.length)
      const spot = remainingSpots[randomIndex]
      // Check if we already have a spot at this location
      if (!selectedSpots.some((s) => s.lat === spot.lat && s.lng === spot.lng)) {
        selectedSpots.push(spot)
      }
      remainingSpots.splice(randomIndex, 1)
    }

    // Shuffle the final selection to randomize the order
    const shuffledSpots = selectedSpots.sort(() => Math.random() - 0.5)

    return NextResponse.json({ spots: shuffledSpots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

