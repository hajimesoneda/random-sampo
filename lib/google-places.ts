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

const textSearchStrategy = async (lat: number, lng: number, keywords: string, radius: number) => {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
  url.searchParams.append("query", `${encodeURIComponent(keywords)} near ${lat},${lng}`)
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

export async function fetchNearbyPlaces({
  lat,
  lng,
  type,
  radius: providedRadius,
}: {
  lat: number
  lng: number
  type: string
  radius: number
}): Promise<Spot[]> {
  console.log(`Fetching places for category: ${type}`)
  const keywords = getCategoryKeywords(type)
  const isCustom = isCustomCategory(type)

  const MAX_RADIUS = 5000 // 最大5km
  const radius = Math.min(providedRadius, MAX_RADIUS)

  const textSearchStrategy = async () => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json")
    url.searchParams.append("query", `${encodeURIComponent(keywords)} near`)
    url.searchParams.append("location", `${lat},${lng}`)
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
  }

  const nearbySearchStrategy = async () => {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
    url.searchParams.append("location", `${lat},${lng}`)
    url.searchParams.append("radius", radius.toString())
    url.searchParams.append("keyword", encodeURIComponent(keywords))
    url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
    url.searchParams.append("language", "ja")
    url.searchParams.append("region", "jp")

    console.log(`Trying Nearby Search with URL: ${url.toString()}`)
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Nearby Search failed: ${response.statusText}`)
    }
    return response.json()
  }

  const searchStrategies = [textSearchStrategy, nearbySearchStrategy]

  let results: PlacesResponse | null = null
  for (const strategy of searchStrategies) {
    try {
      results = await strategy()
      if (results.status === "OK" && results.results.length > 0) {
        break
      }
    } catch (error) {
      console.error("Search strategy failed:", error)
    }
  }

  if (results && results.status === "OK" && results.results.length > 0) {
    const filteredResults = results.results.filter((place) => {
      const distance = calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
      return distance <= radius / 1000
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
        photo: place.photos?.[0]?.photo_reference || getCategoryPlaceholder(type),
      }))
    }
  }

  console.log(`No results found with status: ${results?.status}`)
  return []
}

