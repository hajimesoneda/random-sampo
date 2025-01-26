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
  opening_hours?: {
    open_now: boolean
    weekday_text?: string[]
  }
  price_level?: number
}

const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY
if (!MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY is not configured")
}

async function getNearbyPlaces(lat: number, lng: number, categoryId: string): Promise<Spot[]> {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&language=ja&key=${MAPS_API_KEY}`

  // Use keyword search for the category
  url += `&keyword=${encodeURIComponent(categoryId)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error(`Invalid response from Google Places API: ${JSON.stringify(data)}`)
    }

    return data.results.map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      type: categoryId,
      photo: place.photos
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${MAPS_API_KEY}`
        : null,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    }))
  } catch (error) {
    console.error(`Error fetching nearby places for category ${categoryId}:`, error)
    return []
  }
}

export async function GET(request: Request) {
  try {
    if (!Array.isArray(stationsData) || stationsData.length === 0) {
      throw new Error("駅データが見つかりません")
    }

    const randomStationData = stationsData[Math.floor(Math.random() * stationsData.length)]
    if (!randomStationData) {
      throw new Error("駅が見つかりません")
    }

    const randomStation: Station = {
      ...randomStationData,
      spots: [],
      passengers: randomStationData.passengers ?? undefined,
      firstDeparture: randomStationData.firstDeparture ?? undefined,
    }

    // Get categories from the request URL
    const url = new URL(request.url)
    const categoriesParam = url.searchParams.get("categories")
    const categories = categoriesParam ? JSON.parse(decodeURIComponent(categoriesParam)) : []

    // Fetch spots for all provided categories
    const allSpots = await Promise.all(
      categories.map((categoryId: string) => getNearbyPlaces(randomStation.lat, randomStation.lng, categoryId)),
    )
    const flattenedSpots = allSpots.flat()

    // Shuffle all spots and select up to 4 unique spots
    const shuffledSpots = flattenedSpots.sort(() => Math.random() - 0.5)
    const uniqueSpots = Array.from(new Set(shuffledSpots.map((s) => s.name)))
      .map((name) => shuffledSpots.find((s) => s.name === name))
      .slice(0, 4)

    randomStation.spots = uniqueSpots.filter(Boolean) as Spot[]

    return NextResponse.json(randomStation)
  } catch (error) {
    console.error("ランダム駅の取得エラー:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ランダム駅の取得に失敗しました" },
      { status: 500 },
    )
  }
}

