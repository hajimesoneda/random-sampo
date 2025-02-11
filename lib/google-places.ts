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
  const types = Array.isArray(getCategoryType(type))
    ? (getCategoryType(type) as string[])
    : [getCategoryType(type) as string]
  const keywords = getCategoryKeywords(type)

  // Fetch places for each type
  const allResults = await Promise.all(
    types.map(async (placeType) => {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
      url.searchParams.append("location", `${lat},${lng}`)
      url.searchParams.append("radius", radius.toString())
      url.searchParams.append("type", placeType)
      if (keywords) {
        url.searchParams.append("keyword", keywords)
      }
      url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
      url.searchParams.append("language", "ja")
      url.searchParams.append("region", "jp")

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`Failed to fetch nearby places: ${response.statusText}`)
      }

      const data: PlacesResponse = await response.json()
      return data.results
    }),
  )

  // Merge and filter results
  const mergedResults = allResults.flat()

  // Filter results based on type and keywords
  const filteredResults =
    type === "public_bath"
      ? mergedResults.filter(
          (place) =>
            place.types.some((t) => ["spa", "onsen"].includes(t)) &&
            (place.name.includes("銭湯") || place.name.includes("温泉") || place.name.includes("スーパー銭湯")),
        )
      : mergedResults

  // Remove duplicates based on place_id
  const uniqueResults = filteredResults.filter(
    (place, index, self) => index === self.findIndex((p) => p.place_id === place.place_id),
  )

  return uniqueResults.map((place) => ({
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    type: type,
    photo: place.photos?.[0]?.photo_reference || "/placeholder.svg?height=400&width=400",
  }))
}

