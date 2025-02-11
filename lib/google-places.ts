import type { Spot } from "@/types/station"
import { getCategoryType, getCategoryKeywords } from "./category-mapping"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY is not set")
}

interface Location {
  lat: number
  lng: number
}

interface PlacesResponse {
  results: Array<{
    place_id: string
    name: string
    geometry: {
      location: Location
    }
    photos?: Array<{
      photo_reference: string
    }>
    types: string[]
  }>
  status: string
  error_message?: string
}

export async function fetchNearbyPlaces({
  lat,
  lng,
  type,
  radius,
}: {
  lat: number
  lng: number
  type: string
  radius: number
}): Promise<Spot[]> {
  const apiType = getCategoryType(type)
  const keywords = getCategoryKeywords(type) || type

  console.log(`Fetching places for type: ${type}, API type: ${apiType}, keywords: ${keywords}`)

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
  url.searchParams.append("query", `${keywords} near ${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
  url.searchParams.append("language", "ja")
  url.searchParams.append("region", "jp")

  // 事前定義されたカテゴリーの場合のみ、typeパラメータを追加
  if (apiType !== "point_of_interest") {
    url.searchParams.append("type", Array.isArray(apiType) ? apiType[0] : apiType)
  }

  console.log(`Fetching from URL: ${url.toString()}`)

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby places: ${response.statusText}`)
  }

  const data: PlacesResponse = await response.json()

  if (data.status !== "OK") {
    console.error(`Places API error: ${data.status}`, data.error_message)
    return []
  }

  console.log(`Found ${data.results.length} results for type ${type}`)

  return data.results.map((place) => ({
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    type: type,
    photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
  }))
}

