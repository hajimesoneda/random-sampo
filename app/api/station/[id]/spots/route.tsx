import { NextResponse } from "next/server"
import type { Station, Spot } from "@/types/station"
import stationsData from "@/data/tokyo-stations.json"

interface PlaceResult {
  place_id: string
  name: string
  photos?: { photo_reference: string }[]
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

async function getNearbyPlaces(lat: number, lng: number, category: string): Promise<Spot[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&keyword=${encodeURIComponent(category)}&language=ja&key=${process.env.GOOGLE_PLACES_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()
  return data.results.slice(0, 4).map((place: PlaceResult) => ({
    id: place.place_id,
    name: place.name,
    type: category,
    photo: place.photos
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      : null,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
  }))
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const stationId = decodeURIComponent(params.id)
    const station = (stationsData as Station[]).find((s) => s.id === stationId)

    if (!station) {
      return NextResponse.json({ error: "駅が見つかりません" }, { status: 404 })
    }

    // Get categories from the request URL
    const url = new URL(request.url)
    const categoriesParam = url.searchParams.get("categories")
    const categories = categoriesParam ? JSON.parse(decodeURIComponent(categoriesParam)) : []

    // Fetch spots for all provided categories
    const allSpots = await Promise.all(
      categories.map((categoryId: string) => getNearbyPlaces(station.lat, station.lng, categoryId)),
    )
    const flattenedSpots = allSpots.flat()

    // Shuffle all spots and select up to 4 unique spots
    const shuffledSpots = flattenedSpots.sort(() => Math.random() - 0.5)
    const uniqueSpots = Array.from(new Set(shuffledSpots.map((s) => s.name)))
      .map((name) => shuffledSpots.find((s) => s.name === name))
      .slice(0, 4)

    return NextResponse.json({ spots: uniqueSpots.filter(Boolean) })
  } catch (error) {
    console.error("スポットの取得エラー:", error)
    return NextResponse.json({ error: "スポットの取得に失敗しました" }, { status: 500 })
  }
}

