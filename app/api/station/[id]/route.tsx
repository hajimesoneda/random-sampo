import { NextResponse } from "next/server"
import { fetchNearbyPlaces } from "@/lib/google-places"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const stationId = params.id
  const { searchParams } = new URL(request.url)
  const categoriesParam = searchParams.get("categories")
  const categories = categoriesParam ? JSON.parse(categoriesParam) : []

  try {
    // Get station coordinates from the database
    const station = await prisma.station.findUnique({
      where: { id: stationId },
      select: { lat: true, lng: true },
    })

    if (!station) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 })
    }

    // Fetch spots for each category
    const spotsPromises = categories.map(async (category: string) => {
      const spots = await fetchNearbyPlaces({
        lat: station.lat,
        lng: station.lng,
        type: category,
        radius: 1000, // 1km radius
      })
      return spots.map((spot) => ({ ...spot, type: category }))
    })

    const spotsArrays = await Promise.all(spotsPromises)
    const spots = spotsArrays.flat().slice(0, 4) // Limit to 4 spots total

    return NextResponse.json({ spots })
  } catch (error) {
    console.error("Error fetching spots:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

