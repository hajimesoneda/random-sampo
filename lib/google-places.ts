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

// 2点間の距離をメートルで計算するヘルパー関数
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
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

  // 東京の境界ボックスを定義
  const TOKYO_BOUNDS = {
    north: 35.8984,
    south: 35.5333,
    east: 139.925,
    west: 138.9,
  }

  // 検索戦略を配列として定義
  const searchStrategies = [
    // 戦略1: Nearby Search APIを使用（locationBiasとboundsを追加）
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
      // 東京に限定するためのバイアスを追加
      url.searchParams.append("locationbias", `circle:${radius}@${lat},${lng}`)

      console.log(`Trying Nearby Search with URL: ${url.toString()}`)
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Nearby Search failed: ${response.statusText}`)
      }
      return response.json()
    },
    // 戦略2: Text Search APIを使用（地域限定パラメータを追加）
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", `${keywords} near ${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      // 東京に限定するための領域パラメータを追加
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append(
        "bounds",
        `${TOKYO_BOUNDS.south},${TOKYO_BOUNDS.west}|${TOKYO_BOUNDS.north},${TOKYO_BOUNDS.east}`,
      )

      console.log(`Trying Text Search with URL: ${url.toString()}`)
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Text Search failed: ${response.statusText}`)
      }
      return response.json()
    },
  ]

  // 各戦略を順番に試す
  for (const strategy of searchStrategies) {
    try {
      const data: PlacesResponse = await strategy()

      if (data.status === "OK" && data.results.length > 0) {
        console.log(`Found ${data.results.length} places for category ${type}`)

        // 結果をフィルタリング：
        // 1. 指定された半径内のスポットのみを取得
        // 2. 東京の境界内のスポットのみを取得
        const filteredResults = data.results.filter((place) => {
          const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)

          const isWithinRadius = distance <= radius
          const isWithinTokyo =
            place.geometry.location.lat <= TOKYO_BOUNDS.north &&
            place.geometry.location.lat >= TOKYO_BOUNDS.south &&
            place.geometry.location.lng <= TOKYO_BOUNDS.east &&
            place.geometry.location.lng >= TOKYO_BOUNDS.west

          return isWithinRadius && isWithinTokyo
        })

        if (filteredResults.length > 0) {
          return filteredResults.map((place) => ({
            id: place.place_id,
            name: place.name,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            type: type,
            categoryId: type,
            photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
          }))
        }
      }

      console.log(`No valid results found with status: ${data.status}`)
    } catch (error) {
      console.error(`Strategy failed for category ${type}:`, error)
    }
  }

  console.log(`No valid results found for category ${type} after trying all strategies`)
  return []
}

