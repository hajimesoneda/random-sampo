import type { Spot } from "@/types/station"

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
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
  url.searchParams.append("location", `${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())
  url.searchParams.append("type", type)
  url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
  url.searchParams.append("language", "ja") // Add Japanese language parameter
  url.searchParams.append("region", "jp") // Add Japan region parameter

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby places: ${response.statusText}`)
  }

  const data: PlacesResponse = await response.json()

  return data.results.map((place) => ({
    id: place.place_id,
    name: place.name,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    type: type,
    photo: place.photos?.[0]
      ? `/api/place-photo?reference=${place.photos[0].photo_reference}`
      : "/placeholder.svg?height=400&width=400",
  }))
}

