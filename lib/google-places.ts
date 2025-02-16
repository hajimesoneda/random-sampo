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
    // 戦略1: Nearby Search APIを使用（日本語キーワード優先）
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("keyword", keywords)
      if (Array.isArray(apiType)) {
        url.searchParams.append("type", apiType[0]) // 最初のタイプを使用
      } else if (typeof apiType === "string") {
        url.searchParams.append("type", apiType)
      }
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")
      // rankbyをprominenceに設定して、より関連性の高い結果を取得
      url.searchParams.append("rankby", "prominence")

      console.log(`Trying Nearby Search with URL: ${url.toString()}`)
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Nearby Search failed: ${response.statusText}`)
      }
      return response.json()
    },
    // 戦略2: Text Search APIを使用（より詳細な検索）
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      // 日本語のロケーション情報を追加
      url.searchParams.append("query", `${keywords} 近く ${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")

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
        // 結果をフィルタリング：指定された半径内のスポットのみを取得
        const filteredResults = data.results.filter((place) => {
          const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
          return distance <= radius / 1000 // radiusはメートル単位なので、kmに変換
        })

        if (filteredResults.length > 0) {
          console.log(`Found ${filteredResults.length} places for category ${type}`)
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

      console.log(`No results found with status: ${data.status}`)
    } catch (error) {
      console.error(`Strategy failed for category ${type}:`, error)
    }
  }

  console.log(`No results found for category ${type} after trying all strategies`)
  return []
}

// 2点間の距離をキロメートル単位で計算するヘルパー関数
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球の半径（キロメートル）
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

