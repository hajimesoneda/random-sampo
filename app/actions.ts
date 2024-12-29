'use server'

import { cookies } from 'next/headers'
import { Station, VisitInfo } from '@/types/station'

// 仮の駅データ
const stations: Station[] = [
  {
    id: "shinjuku",
    name: "新宿",
    lines: ["山手線", "中央線", "京王線"],
    passengers: 748000,
    firstDeparture: "04:32",
    lat: 35.6896,
    lng: 139.7006,
    spots: [
      {
        id: "gyoen",
        name: "新宿御苑",
        type: "観光スポット",
        image: "/placeholder.svg?height=200&width=200"
      },
      {
        id: "omoide",
        name: "思い出横丁",
        type: "グルメ",
        image: "/placeholder.svg?height=200&width=200"
      },
      {
        id: "tocho",
        name: "東京都庁展望室",
        type: "観光スポット",
        image: "/placeholder.svg?height=200&width=200"
      }
    ]
  },
  // 他の駅データ...
]

export async function getRandomStation(): Promise<Station> {
  const visitedStations = JSON.parse(cookies().get('visited-stations')?.value || '[]')
  const availableStations = stations.filter(station => !visitedStations.includes(station.id))
  
  if (availableStations.length === 0) {
    throw new Error('すべての駅を訪問済みです！')
  }
  
  const randomIndex = Math.floor(Math.random() * availableStations.length)
  return availableStations[randomIndex]
}

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

