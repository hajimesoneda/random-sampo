import type { Spot } from "@/types/station"
import { getCategoryKeywords, isCustomCategory } from "./category-mapping"

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

// キャッシュのインターフェース
interface CacheItem {
  timestamp: number
  data: Spot[]
}

// メモリ内キャッシュ
const cache: { [key: string]: CacheItem } = {}
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000 // 24時間

async function fetchPlaces(url: URL): Promise<PlacesResponse> {
  console.log(`Fetching places with URL: ${url.toString()}`)
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Places API request failed: ${response.statusText}`)
  }
  const data: PlacesResponse = await response.json()
  console.log(`API Response Status: ${data.status}, Results count: ${data.results.length}`)
  return data
}

export async function fetchNearbyPlaces({
  lat,
  lng,
  types,
}: {
  lat: number
  lng: number
  types: string[]
}): Promise<Record<string, Spot[]>> {
  const radius = 5000 // 5km
  const results: Record<string, Spot[]> = {}
  const combinedKeywords = types.map((type) => getCategoryKeywords(type)).join("|")

  // キャッシュキーの生成
  const cacheKey = `${lat},${lng},${combinedKeywords}`

  // キャッシュチェック
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_EXPIRATION) {
    console.log("Returning cached results")
    return groupSpotsByType(cache[cacheKey].data, types)
  }

  const searchStrategies = [
    // Text Search API
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
      url.searchParams.append("query", `${encodeURIComponent(combinedKeywords)} near`)
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")
      return await fetchPlaces(url)
    },
    // Nearby Search API
    async () => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("keyword", encodeURIComponent(combinedKeywords))
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")
      return await fetchPlaces(url)
    },
  ]

  let placesResponse: PlacesResponse | null = null
  for (const strategy of searchStrategies) {
    try {
      placesResponse = await strategy()
      if (placesResponse.status === "OK" && placesResponse.results.length > 0) {
        break
      }
    } catch (error) {
      console.error("Search strategy failed:", error)
    }
  }

  if (placesResponse && placesResponse.status === "OK" && placesResponse.results.length > 0) {
    const allSpots = placesResponse.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type: place.types[0],
      categoryId: place.types[0],
      photo: place.photos?.[0]?.photo_reference || getCategoryPlaceholder(place.types[0]),
    }))

    // キャッシュの更新
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: allSpots,
    }

    return groupSpotsByType(allSpots, types)
  }

  console.log(`No results found with status: ${placesResponse?.status}`)
  return results
}

function groupSpotsByType(spots: Spot[], types: string[]): Record<string, Spot[]> {
  const groupedSpots: Record<string, Spot[]> = {}
  types.forEach((type) => {
    groupedSpots[type] = spots.filter(
      (spot) =>
        spot.type === type ||
        (isCustomCategory(type) && spot.name.toLowerCase().includes(getCategoryKeywords(type).toLowerCase())),
    )
  })
  return groupedSpots
}

function getCategoryPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    shopping_mall: "/placeholder-images/shopping-mall.svg",
    tourist_attraction: "/placeholder-images/tourist-attraction.svg",
    restaurant: "/placeholder-images/restaurant.svg",
    cafe: "/placeholder-images/cafe.svg",
    public_bath: "/placeholder-images/public-bath.svg",
    park: "/placeholder-images/park.svg",
    museum: "/placeholder-images/museum.svg",
    amusement_park: "/placeholder-images/amusement-park.svg",
  }

  return placeholders[type] || "/placeholder.svg?height=400&width=400"
}

