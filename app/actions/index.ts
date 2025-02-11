"use server"

import { db } from "@/src/db"
import { visits, favorites } from "@/src/db/schema"
import { eq, and } from "drizzle-orm"
import type { VisitInfo, FavoriteStation, WeatherType } from "@/types/station"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import type { Session } from "next-auth"

export async function saveVisit(info: VisitInfo, userId: number) {
  console.log("Saving visit:", info, "for user:", userId)
  try {
    const result = await db
      .insert(visits)
      .values({
        userId,
        stationId: info.stationId,
        stationName: info.name,
        date: new Date(info.date),
        weather: info.weather,
        memo: info.memo || "",
      })
      .returning()
    console.log("Visit saved successfully:", result)
    return result[0]
  } catch (error) {
    console.error("Error saving visit:", error)
    throw new Error("Failed to save visit")
  }
}

export async function saveVisitWithSession(info: VisitInfo) {
  const session = await getServerSession(authOptions)
  console.log("Session in saveVisitWithSession:", JSON.stringify(session, null, 2))

  if (!session?.user?.id) {
    console.error("No user ID in session:", session)
    throw new Error("User not authenticated")
  }

  try {
    const userId = Number.parseInt(session.user.id)
    return await saveVisit(info, userId)
  } catch (error) {
    console.error("Error in saveVisitWithSession:", error)
    throw error
  }
}

export async function getVisitedStations(userId: number): Promise<VisitInfo[]> {
  console.log("Getting visited stations for user:", userId)
  try {
    const result = await db.select().from(visits).where(eq(visits.userId, userId))
    console.log("Visited stations retrieved:", result)
    return result.map((visit) => ({
      stationId: visit.stationId,
      name: visit.stationName,
      date: visit.date.toISOString(),
      weather: visit.weather as WeatherType,
      memo: visit.memo || "",
    }))
  } catch (error) {
    console.error("Error getting visited stations:", error)
    throw error
  }
}

export async function resetVisitedStations(userId: number) {
  console.log("Resetting visited stations for user:", userId)
  try {
    const result = await db.delete(visits).where(eq(visits.userId, userId)).returning()
    console.log("Visited stations reset:", result)
    return result
  } catch (error) {
    console.error("Error resetting visited stations:", error)
    throw error
  }
}

export async function toggleFavoriteStation(userId: number, station: FavoriteStation) {
  console.log("Toggling favorite station:", station, "for user:", userId)
  try {
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.stationId, station.id)))
      .limit(1)

    if (existingFavorite.length > 0) {
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.stationId, station.id)))
    } else {
      await db.insert(favorites).values({
        userId,
        stationId: station.id,
        stationName: station.name,
      })
    }

    return getFavoriteStations(userId)
  } catch (error) {
    console.error("Error toggling favorite station:", error)
    throw error
  }
}

export async function getFavoriteStations(userId: number): Promise<FavoriteStation[]> {
  console.log("Getting favorite stations for user:", userId)
  try {
    const result = await db.select().from(favorites).where(eq(favorites.userId, userId))
    console.log("Favorite stations retrieved:", result)
    return result.map((favorite) => ({
      id: favorite.stationId,
      name: favorite.stationName,
      lines: [], // 路線情報はデータベースに保存されていないため、空の配列を返します
    }))
  } catch (error) {
    console.error("Error getting favorite stations:", error)
    throw error
  }
}

