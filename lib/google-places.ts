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

  // カスタムカテゴリーの場合はキーワードを、それ以外は日本語ラベルと英語タイプの両方を使用
  const queryKeyword = isCustomCategory ? keywords : `${keywords}`

  console.log(
    `Fetching places for type: ${type}, API type: ${apiType}, keywords: ${keywords}, queryKeyword: ${queryKeyword}`,
  )

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
  url.searchParams.append("query", `${queryKeyword} near ${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
  url.searchParams.append("language", "ja")
  url.searchParams.append("region", "jp")

  // 事前定義されたカテゴリーの場合のみ、typeパラメータを追加
  if (!isCustomCategory && apiType !== "point_of_interest") {
    if (Array.isArray(apiType)) {
      // 複数のタイプがある場合、ランダムに1つを選択
      const randomType = apiType[Math.floor(Math.random() * apiType.length)]
      url.searchParams.append("type", randomType)
    } else {
      url.searchParams.append("type", apiType)
    }
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

  // 各カテゴリーから2つのスポットをランダムに選択
  const shuffledResults = shuffleArray(data.results)
  const selectedResults = shuffledResults.slice(0, 2)

  return selectedResults.map((place) => ({
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    type: type,
    photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
  }))
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

