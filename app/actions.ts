'use server'

import { cookies } from 'next/headers'
import { Station, VisitInfo, FavoriteStation } from '@/types/station'

export async function saveVisit(info: VisitInfo) {
  const visitedStations = JSON.parse(cookies().get('visited-stations')?.value || '[]')
  visitedStations.push(info.stationId)

  cookies().set('visited-stations', JSON.stringify(visitedStations))

  const visits = JSON.parse(cookies().get('visits')?.value || '[]')
  visits.push(info)
  cookies().set('visits', JSON.stringify(visits))
}

export async function getVisitedStations(): Promise<VisitInfo[]> {
  return JSON.parse(cookies().get('visits')?.value || '[]')
}

export async function resetVisitedStations() {
  cookies().set('visited-stations', '[]')
  cookies().set('visits', '[]')
}

export async function toggleFavoriteStation(station: FavoriteStation) {
  const favorites = JSON.parse(cookies().get('favorite-stations')?.value || '[]')
  const index = favorites.findIndex((fav: FavoriteStation) => fav.id === station.id)
  
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(station)
  }

  cookies().set('favorite-stations', JSON.stringify(favorites))
  return favorites
}

export async function getFavoriteStations(): Promise<FavoriteStation[]> {
  return JSON.parse(cookies().get('favorite-stations')?.value || '[]')
}

