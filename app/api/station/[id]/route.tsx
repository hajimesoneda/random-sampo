import { NextResponse } from 'next/server'
import { Station } from '@/types/station'
import stationsData from '@/data/tokyo-stations.json'

async function getNearbyPlaces(lat: number, lng: number, type: string, limit: number) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${type}&language=ja&key=${process.env.GOOGLE_PLACES_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()
  return data.results.slice(0, limit).map((place: any) => ({
    id: place.place_id,
    name: place.name,
    type: type,
    photo: place.photos ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}` : null
  }))
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const stationId = decodeURIComponent(params.id)
    const station = (stationsData as Station[]).find(s => s.id === stationId)

    if (!station) {
      return NextResponse.json({ error: '駅が見つかりません' }, { status: 404 })
    }

    // 周辺のスポットを取得
    const touristSpots = await getNearbyPlaces(station.lat, station.lng, 'tourist_attraction', 2)
    const cafes = await getNearbyPlaces(station.lat, station.lng, 'cafe', 1)
    const restaurants = await getNearbyPlaces(station.lat, station.lng, 'restaurant', 1)

    // スポットをシャッフルして重複を避ける
    const allSpots = [...touristSpots, ...cafes, ...restaurants]
    const shuffledSpots = allSpots.sort(() => Math.random() - 0.5)
    const uniqueSpots = Array.from(new Set(shuffledSpots.map(s => s.name)))
      .map(name => shuffledSpots.find(s => s.name === name))
      .slice(0, 4)

    return NextResponse.json({ ...station, spots: uniqueSpots })
  } catch (error) {
    console.error('駅の取得エラー:', error)
    return NextResponse.json({ error: '駅の取得に失敗しました' }, { status: 500 })
  }
}

