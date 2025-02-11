export type WeatherType = "unknown" | "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪"

export interface Station {
  id: string
  name: string
  lines: string[]
  lat: number
  lng: number
  spots?: Spot[]
  passengers?: number
  firstDeparture?: string
}

export interface Spot {
  id: string
  name: string
  type: "tourist_attraction" | "cafe" | "restaurant" | "public_bath" | string
  photo: string | null
  lat: number
  lng: number
  price?: number
  openingHours?: string
}

export interface VisitInfo {
  stationId: string
  name: string
  date: string
  weather: WeatherType
  memo?: string
}

export interface FavoriteStation {
  id: string
  name: string
  lines: string[]
}
