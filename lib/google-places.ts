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
  console.log(`Fetching places for category: ${type}`)
  const apiType = getCategoryType(type)
  const keywords = getCategoryKeywords(type) || type

  // 検索戦略を配列として定義
  const searchStrategies = [
    // 戦略1: Nearby Search APIを使用
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("keyword", keywords)
      if (Array.isArray(apiType)) {
        url.searchParams.append("type", apiType[0])
      } else if (typeof apiType === "string") {
        url.searchParams.append("type", apiType)
      }
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")

      console.log(`Trying Nearby Search with URL: ${url.toString()}`)
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Nearby Search failed with status: ${response.status}`)
      }

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (error) {
        console.error("Failed to parse Nearby Search response:", text)
        throw new Error("Invalid JSON response from Nearby Search")
      }
    },
    // 戦略2: Text Search APIを使用
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", `${keywords} near ${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")

      console.log(`Trying Text Search with URL: ${url.toString()}`)
      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Text Search failed with status: ${response.status}`)
      }

      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (error) {
        console.error("Failed to parse Text Search response:", text)
        throw new Error("Invalid JSON response from Text Search")
      }
    },
  ]

  // 各戦略を順番に試す
  for (const strategy of searchStrategies) {
    try {
      const data: PlacesResponse = await strategy()

      if (data.status === "OK" && data.results.length > 0) {
        console.log(`Found ${data.results.length} places for category ${type}`)
        return data.results.map((place) => ({
          id: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: type,
          categoryId: type,
          photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
        }))
      }

      if (data.error_message) {
        console.error(`API error for category ${type}:`, data.error_message)
      }

      console.log(`No results found with status: ${data.status}`)
    } catch (error) {
      console.error(`Strategy failed for category ${type}:`, error)
    }
  }

  console.log(`No results found for category ${type} after trying all strategies`)
  return []
}

