'use server'

import { cookies } from 'next/headers'
import { Station, VisitInfo } from '@/types/station'

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

