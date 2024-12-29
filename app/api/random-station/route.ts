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

export async function GET() {
  try {
    if (!Array.isArray(stationsData) || stationsData.length === 0) {
      throw new Error('駅データが見つかりません')
    }

    // ランダムに駅を選択
    const randomStation = stationsData[Math.floor(Math.random() * stationsData.length)] as Station

    if (!randomStation) {
      throw new Error('駅が見つかりません')
    }

    // 周辺のスポットを取得
    const touristSpots = await getNearbyPlaces(randomStation.lat, randomStation.lng, 'tourist_attraction', 2)
    const cafes = await getNearbyPlaces(randomStation.lat, randomStation.lng, 'cafe', 1)
    const restaurants = await getNearbyPlaces(randomStation.lat, randomStation.lng, 'restaurant', 1)

    const spots = [...touristSpots, ...cafes, ...restaurants]

    return NextResponse.json({ ...randomStation, spots })
  } catch (error) {
    console.error('ランダム駅の取得エラー:', error)
    return NextResponse.json({ error: 'ランダム駅の取得に失敗しました' }, { status: 500 })
  }
}

