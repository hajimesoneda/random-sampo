import type { Spot } from "@/types/station"

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

interface FetchNearbyPlacesParams {
  lat: number
  lng: number
  type: string | string[]
  radius: number
}

export async function fetchNearbyPlaces({ lat, lng, type, radius }: FetchNearbyPlacesParams): Promise<Spot[]> {
  console.log(`Fetching places for type/keyword:`, type)

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
  url.searchParams.append("location", `${lat},${lng}`)
  url.searchParams.append("radius", radius.toString())

  // typeが配列の場合はtypeパラメーターとして、文字列の場合はkeywordとして扱う
  if (Array.isArray(type)) {
    type.forEach((t) => url.searchParams.append("type", t))
  } else {
    url.searchParams.append("keyword", encodeURIComponent(type))
  }

  url.searchParams.append("key", GOOGLE_MAPS_API_KEY)
  url.searchParams.append("language", "ja")

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Places API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`API Response for ${type}:`, JSON.stringify(data, null, 2))

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error(`Invalid response from Places API: ${JSON.stringify(data)}`)
    }

    return data.results.map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type: Array.isArray(type) ? type[0] : type, // 配列の場合は最初の要素を使用
      photo: place.photos?.[0]?.photo_reference || "",
    }))
  } catch (error) {
    console.error(`Error fetching places for ${type}:`, error)
    return []
  }
}

