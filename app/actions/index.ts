"use server"

import { cookies } from "next/headers"
import type { VisitInfo, FavoriteStation } from "@/types/station"

export async function saveVisit(info: VisitInfo) {
  const visits = JSON.parse(cookies().get("visits")?.value || "[]")
  const existingIndex = visits.findIndex((v: VisitInfo) => v.stationId === info.stationId)

  if (existingIndex !== -1) {
    // 既存の訪問情報を更新し、リストの先頭に移動
    const updatedVisit = { ...visits[existingIndex], ...info }
    visits.splice(existingIndex, 1)
    visits.unshift(updatedVisit)
  } else {
    // 新しい訪問情報をリストの先頭に追加
    visits.unshift(info)

    // visited-stations クッキーも更新
    const visitedStations = JSON.parse(cookies().get("visited-stations")?.value || "[]")
    if (!visitedStations.includes(info.stationId)) {
      visitedStations.unshift(info.stationId)
      cookies().set("visited-stations", JSON.stringify(visitedStations))
    }
  }

  cookies().set("visits", JSON.stringify(visits))
}

export async function getVisitedStations(): Promise<VisitInfo[]> {
  return JSON.parse(cookies().get("visits")?.value || "[]")
}

export async function resetVisitedStations() {
  cookies().set("visited-stations", "[]")
  cookies().set("visits", "[]")
}

export async function toggleFavoriteStation(station: FavoriteStation) {
  const favorites = JSON.parse(cookies().get("favorite-stations")?.value || "[]")
  const index = favorites.findIndex((fav: FavoriteStation) => fav.id === station.id)

  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(station)
  }

  cookies().set("favorite-stations", JSON.stringify(favorites))
  return favorites
}

export async function getFavoriteStations(): Promise<FavoriteStation[]> {
  const favorites = JSON.parse(cookies().get("favorite-stations")?.value || "[]")
  return favorites
}

