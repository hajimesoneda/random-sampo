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
    // 戦略1: Nearby Search APIを使用（標準的なカテゴリーの場合）
    async () => {
      if (Array.isArray(apiType)) {
        // 複数のタイプがある場合、それぞれで検索して結果を結合
        const results = await Promise.all(
          apiType.map(async (t) => {
            const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
            url.searchParams.append("location", `${lat},${lng}`)
            url.searchParams.append("radius", radius.toString())
            url.searchParams.append("type", t)
            url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
            url.searchParams.append("language", "ja")
            return fetch(url.toString())
              .then((res) => res.json())
              .then((data: PlacesResponse) => (data.status === "OK" ? data.results : []))
          }),
        )
        return results.flat()
      } else {
        const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
        url.searchParams.append("location", `${lat},${lng}`)
        url.searchParams.append("radius", radius.toString())
        if (!isCustomCategory) {
          url.searchParams.append("type", apiType as string)
        }
        url.searchParams.append("keyword", keywords)
        url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
        url.searchParams.append("language", "ja")
        const response = await fetch(url.toString())
        const data: PlacesResponse = await response.json()
        return data.status === "OK" ? data.results : []
      }
    },
    // 戦略2: Text Search APIを使用（キーワードベースの検索）
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", `${keywords} near ${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      const response = await fetch(url.toString())
      const data: PlacesResponse = await response.json()
      return data.status === "OK" ? data.results : []
    },
    // 戦略3: より広い範囲で検索
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", (radius * 1.5).toString())
      url.searchParams.append("keyword", keywords)
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      const response = await fetch(url.toString())
      const data: PlacesResponse = await response.json()
      return data.status === "OK" ? data.results : []
    },
  ]

  // 重複を除去する関数
  const removeDuplicates = (spots: Spot[]): Spot[] => {
    const seen = new Set()
    return spots.filter((spot) => {
      const key = `${spot.lat},${spot.lng}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // 各戦略を順番に試す
  for (const getSearchResults of searchStrategies) {
    try {
      const results = await getSearchResults()
      if (results.length > 0) {
        const spots = removeDuplicates(
          results.map((place) => ({
            id: place.place_id,
            name: place.name,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            type: type,
            photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
          })),
        )
        console.log(`Found ${spots.length} spots for category ${type}`)
        return spots
      }
    } catch (error) {
      console.error(`Error in search strategy for ${type}:`, error)
    }
  }

  console.warn(`No results found for type ${type} after trying all strategies`)
  return []
}

