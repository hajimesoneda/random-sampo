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

async function getNearbyPlaces(lat: number, lng: number, type: string, keyword: string | null = null): Promise<Spot[]> {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&language=ja&key=${MAPS_API_KEY}`

  if (type !== "public_bath") {
    url += `&type=${type}`
  } else if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()

  return data.results.map((place: PlaceResult) => {
    const spot: Spot = {
      id: place.place_id,
      name: place.name,
      type: type,
      photo: place.photos
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${MAPS_API_KEY}`
        : null,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    }

    if (type === "public_bath") {
      spot.openingHours = place.opening_hours?.weekday_text ? place.opening_hours.weekday_text.join(", ") : undefined
      spot.price = place.price_level ? place.price_level * 200 + 300 : undefined
    }

    return spot
  })
}

function areLocationsSame(spot1: Spot, spot2: Spot): boolean {
  return spot1.lat === spot2.lat && spot1.lng === spot2.lng
}

function findUniqueSpot(spots: Spot[], selectedSpots: Spot[]): Spot | null {
  for (const spot of spots) {
    if (!selectedSpots.some((selectedSpot) => areLocationsSame(selectedSpot, spot))) {
      return spot
    }
  }
  return null
}

export async function GET() {
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

    const touristSpots = await getNearbyPlaces(randomStation.lat, randomStation.lng, "tourist_attraction")
    const cafes = await getNearbyPlaces(randomStation.lat, randomStation.lng, "cafe")
    const restaurants = await getNearbyPlaces(randomStation.lat, randomStation.lng, "restaurant")
    const publicBaths = await getNearbyPlaces(randomStation.lat, randomStation.lng, "public_bath", "銭湯 OR 温泉")

    const allSpots = [...touristSpots, ...cafes, ...restaurants, ...publicBaths]

    // Shuffle all spots and select up to 4 unique spots
    const shuffledSpots = allSpots.sort(() => Math.random() - 0.5)
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

