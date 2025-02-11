export type WeatherType = "unknown" | "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪" | string

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

export interface Station {
  id: string
  name: string
  lat: number
  lng: number
  lines: string[]
  spots: Spot[]
}

export interface Spot {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  photo: string
}

