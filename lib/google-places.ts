import type { Spot } from "@/types/station"
import { getCategoryKeywords } from "./category-mapping"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY is not set")
}

interface PlaceResult {
  place_id: string
  name: string
  photos?: { photo_reference: string }[]
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
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
  const keywords = getCategoryKeywords(type)

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
  url.searchParams.append("location", `${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())
  url.searchParams.append("keyword", encodeURIComponent(keywords))
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
  url.searchParams.append("language", "ja")

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Places API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error(`Invalid response from Places API: ${JSON.stringify(data)}`)
    }

    return data.results.map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type: type,
      photo: place.photos?.[0]?.photo_reference || "",
    }))
  } catch (error) {
    console.error("Error fetching places:", error)
    return []
  }
}

