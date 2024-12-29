export interface Station {
  id: string
  name: string
  lines: string[]
  passengers: number
  firstDeparture: string
  lat: number
  lng: number
  spots: Spot[]
}

export interface Spot {
  id: string
  name: string
  type: "観光スポット" | "グルメ" | "ショッピング"
  image: string
}

export interface VisitInfo {
  stationId: string
  date: string
  weather: "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪"
  memo: string
}

