'use server'

import { cookies } from 'next/headers'
import { Station, FavoriteStation, VisitInfo } from '@/types/station'

export async function saveVisit(info: VisitInfo) {
  const cookieStore = await cookies()
  const visits = JSON.parse((await cookieStore.get('visits'))?.value || '[]')
  const existingIndex = visits.findIndex((v: VisitInfo) => v.stationId === info.stationId)
  
  if (existingIndex !== -1) {
    // 既存の訪問情報を更新
    visits[existingIndex] = { ...visits[existingIndex], ...info }
  } else {
    // 新しい訪問情報を追加
    visits.push(info)
    
    // visited-stations クッキーも更新
    const visitedStations = JSON.parse((await cookieStore.get('visited-stations'))?.value || '[]')
    if (!visitedStations.includes(info.stationId)) {
      visitedStations.push(info.stationId)
      await cookieStore.set('visited-stations', JSON.stringify(visitedStations))
    }
  }

  await cookieStore.set('visits', JSON.stringify(visits))
}

export async function getVisitedStations(): Promise<VisitInfo[]> {
  const cookieStore = await cookies()
  return JSON.parse((await cookieStore.get('visits'))?.value || '[]')
}

export async function resetVisitedStations() {
  const cookieStore = await cookies()
  await cookieStore.set('visited-stations', '[]')
  await cookieStore.set('visits', '[]')
}

export async function toggleFavoriteStation(station: FavoriteStation): Promise<FavoriteStation[]> {
  const cookieStore = await cookies()
  const favorites = JSON.parse((await cookieStore.get('favorite-stations'))?.value || '[]')
  const index = favorites.findIndex((fav: FavoriteStation) => fav.id === station.id)

  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(station)
  }

  await cookieStore.set('favorite-stations', JSON.stringify(favorites))
  return favorites
}

export async function getFavoriteStations(): Promise<FavoriteStation[]> {
  const cookieStore = await cookies()
  const favoritesString = (await cookieStore.get('favorite-stations'))?.value
  return JSON.parse(favoritesString || '[]')
}

