"use server"

import { db } from "@/src/db"
import { visits, favorites, stations } from "@/src/db/schema"
import type { VisitInfo, FavoriteStation, WeatherType } from "@/types/station"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { eq, and } from "drizzle-orm"

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
  console.log("Attempting to save visit with session")
  const session = await getServerSession(authOptions)
  console.log("Session in saveVisitWithSession:", JSON.stringify(session, null, 2))

  if (!session?.user?.id) {
    console.error("No user ID in session:", session)
    throw new Error("User not authenticated")
  }

  try {
    const userId = Number.parseInt(session.user.id)
    console.log("User ID from session:", userId)
    return await saveVisit(info, userId)
  } catch (error) {
    console.error("Error in saveVisitWithSession:", error)
    throw error
  }
}

export async function toggleFavoriteStation(userId: number, station: FavoriteStation) {
  try {
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.stationId, station.id)))
      .limit(1)

    if (existingFavorite.length > 0) {
      // If the station is already a favorite, remove it
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.stationId, station.id)))
    } else {
      // If the station is not a favorite, add it
      await db.insert(favorites).values({
        userId,
        stationId: station.id,
        stationName: station.name,
      })
    }

    // Return updated list of favorites
    return getFavoriteStations(userId)
  } catch (error) {
    console.error("Error toggling favorite station:", error)
    throw new Error("Failed to toggle favorite station")
  }
}

export async function getFavoriteStations(userId: number): Promise<FavoriteStation[]> {
  try {
    const favoriteStations = await db
      .select({
        id: favorites.stationId,
        name: favorites.stationName,
        lines: stations.lines,
      })
      .from(favorites)
      .leftJoin(stations, eq(favorites.stationId, stations.id))
      .where(eq(favorites.userId, userId))

    return favoriteStations.map((station) => ({
      id: station.id,
      name: station.name,
      lines: station.lines || [],
    }))
  } catch (error) {
    console.error("Error fetching favorite stations:", error)
    throw new Error("Failed to fetch favorite stations")
  }
}

export async function getVisitedStations(userId: number): Promise<VisitInfo[]> {
  try {
    const visitedStations = await db
      .select({
        stationId: visits.stationId,
        name: visits.stationName,
        date: visits.date,
        weather: visits.weather,
        memo: visits.memo,
      })
      .from(visits)
      .where(eq(visits.userId, userId))
      .orderBy(visits.date)

    return visitedStations.map((station) => ({
      ...station,
      date: station.date.toISOString().split("T")[0], // Convert Date to YYYY-MM-DD string
      weather: station.weather as WeatherType, // Cast weather to WeatherType
    }))
  } catch (error) {
    console.error("Error fetching visited stations:", error)
    throw new Error("Failed to fetch visited stations")
  }
}

