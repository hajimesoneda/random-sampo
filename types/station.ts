export interface Station {
  id: string
  name: string
  lines: string[]
  lat: number
  lng: number
  spots?: Spot[]
  passengers?: number | null  // Allow null for passengers
  firstDeparture?: string | null  // Allow null for firstDeparture
}

export interface Spot {
  id: string
  name: string
  type: "tourist_attraction" | "cafe" | "restaurant"
  photo: string | null
  lat: number
  lng: number
}

export interface VisitInfo {
  stationId: string
  name: string
  lines: string[]
  date: string | "unknown"
  weather: "unknown" | "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪"
  memo: string
}

export interface FavoriteStation {
  id: string
  name: string
  lines: string[]
}

