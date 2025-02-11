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
  const isCustomCategory = type.startsWith("custom_")

  // 検索戦略を配列として定義
  const searchStrategies = [
    // 戦略1: キーワードと位置情報で検索
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", `${keywords} near ${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")
      return url
    },
    // 戦略2: より広い範囲で検索
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", keywords)
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", (radius * 1.5).toString()) // 1.5倍の範囲で検索
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")
      return url
    },
    // 戦略3: Nearby Searchを使用
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("keyword", keywords)
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      return url
    },
  ]

  // 各戦略を順番に試す
  for (const getSearchUrl of searchStrategies) {
    try {
      const url = await getSearchUrl()
      console.log(`Trying search with URL: ${url.toString()}`)

      const response = await fetch(url.toString())
      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}`)
        continue
      }

      const data: PlacesResponse = await response.json()

      if (data.status === "OK" && data.results.length > 0) {
        console.log(`Found ${data.results.length} results using strategy`)
        return data.results.slice(0, 4).map((place) => ({
          id: place.place_id,
          name: place.name,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: type,
          photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
        }))
      }

      console.warn(`No results found with status: ${data.status}`)
    } catch (error) {
      console.error("Error in search strategy:", error)
    }
  }

  // すべての戦略が失敗した場合は空配列を返す
  console.warn(`No results found for type ${type} after trying all strategies`)
  return []
}

