import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { fetchNearbyPlaces } from "@/lib/google-places"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categoryIds: string[] = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        lines: true,
      },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    // Fetch spots if categories are provided
    let spots = []
    if (categoryIds.length > 0) {
      // Fetch categories from the database
      const dbCategories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      })

      // Fetch custom categories from user preferences
      const customCategoriesResult = await prisma.categoryPreference.findFirst({
        where: {
          categories: {
            some: {
              id: { in: categoryIds },
            },
          },
        },
        select: { customCategories: true },
      })

      // Parse and validate custom categories
      const customCategories: Category[] = customCategoriesResult?.customCategories
        ? (JSON.parse(customCategoriesResult.customCategories as string) as any[])
            .filter(isValidCategory)
            .filter((cat) => categoryIds.includes(cat.id))
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
      const spotsPromises = allCategories.map((category) =>
        fetchNearbyPlaces({
          lat: station.lat,
          lng: station.lng,
          type: category.id,
          radius: 1000,
        }),
      )

      const spotsResults = await Promise.all(spotsPromises)

      // Ensure at least one spot from each category if available
      const selectedSpots = []
      const remainingSpots = []

      // First pass: Select one spot from each category
      for (let i = 0; i < spotsResults.length; i++) {
        const categorySpots = spotsResults[i]
        if (categorySpots.length > 0) {
          const randomSpot = categorySpots[Math.floor(Math.random() * categorySpots.length)]
          selectedSpots.push({ ...randomSpot, type: allCategories[i].id })
          remainingSpots.push(
            ...categorySpots.filter((s) => s.id !== randomSpot.id).map((s) => ({ ...s, type: allCategories[i].id })),
          )
        }
      }

      // Second pass: Fill remaining slots
      while (selectedSpots.length < 4 && remainingSpots.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingSpots.length)
        const spot = remainingSpots[randomIndex]
        if (!selectedSpots.some((s) => s.lat === spot.lat && s.lng === spot.lng)) {
          selectedSpots.push(spot)
        }
        remainingSpots.splice(randomIndex, 1)
      }

      spots = selectedSpots.sort(() => Math.random() - 0.5)
    }

    return NextResponse.json({
      ...station,
      spots,
    })
  } catch (error) {
    console.error("Error fetching station:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

