let GOOGLE_MAPS_API_KEY: string | null = null

async function fetchApiKey() {
  try {
    const response = await fetch("/api/maps-api-key")
    if (!response.ok) {
      throw new Error("Failed to fetch API key")
    }
    const data = await response.json()
    return data.apiKey
  } catch (error) {
    console.error("Error fetching Google Maps API key:", error)
    return null
  }
}

export const getGoogleMapsLoader = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    GOOGLE_MAPS_API_KEY = await fetchApiKey()
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Failed to load Google Maps API key")
  }

  return {
    load: async () => {
      if (typeof window === "undefined") {
        return
      }

      if (window.google && window.google.maps) {
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,directions`
      script.async = true
      script.defer = true

      document.head.appendChild(script)

      return new Promise<void>((resolve, reject) => {
        script.addEventListener("load", () => resolve())
        script.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")))
      })
    },
  }
}

