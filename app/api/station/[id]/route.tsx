import { NextResponse } from "next/server"
import { db } from "@/src/db"
import { eq, inArray } from "drizzle-orm"
import { stations, categories, categoryPreferences } from "@/src/db/schema"
import { fetchNearbyPlaces } from "@/lib/google-places"
import type { Category } from "@/types/category"
import { isValidCategory } from "@/types/category"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categoryLabels: string[] = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    const stationResult = await db.select().from(stations).where(eq(stations.id, stationId)).limit(1)

    if (stationResult.length === 0) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    const station = stationResult[0]

    // Fetch categories from the database
    const dbCategories = await db.select().from(categories).where(inArray(categories.label, categoryLabels))

    // Fetch custom categories from user preferences
    const customCategoriesResult = await db
      .select({ customCategories: categoryPreferences.customCategories })
      .from(categoryPreferences)
      .where(eq(categoryPreferences.userId, 1)) // Assuming user ID 1 for now
      .limit(1)

    // Parse and validate custom categories
    const customCategories: Category[] = customCategoriesResult[0]?.customCategories
      ? (JSON.parse(customCategoriesResult[0].customCategories as string) as any[])
          .filter(isValidCategory)
          .filter((cat) => categoryLabels.includes(cat.label))
      : []

    // Combine database categories and custom categories
    const allCategories: Category[] = [
      ...dbCategories.map((cat) => ({
        ...cat,
        type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      })),
      ...customCategories,
    ]

    // Fetch spots for the station
    const spots = await fetchSpots(station.lat, station.lng, allCategories)

    return NextResponse.json({
      id: station.id,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      lines: station.lines,
      spots: spots,
    })
  } catch (error) {
    console.error("Error fetching station:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function fetchSpots(lat: number, lng: number, categories: Category[]) {
  const spotsPromises = categories.map(async (category) => {
    const spots = await fetchNearbyPlaces({
      lat,
      lng,
      type: category.id,
      radius: 1000, // 1km radius
    })
    return spots.map((spot) => ({ ...spot, type: category.label }))
  })

  const spotsArrays = await Promise.all(spotsPromises)
  return spotsArrays.flat().slice(0, 4) // Limit to 4 spots total
}

