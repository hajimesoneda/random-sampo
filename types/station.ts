export interface Station {
  id: string
  name: string
  lines: string[]
  lat: number
  lng: number
  spots: Spot[]
}

export interface Spot {
  id: string
  name: string
  type: "tourist_attraction" | "cafe" | "restaurant"
  photo: string | null
}

export interface VisitInfo {
  stationId: string
  date: string | "unknown"
  weather: "unknown" | "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪"
  memo: string
}

