"use server"
import type { VisitInfo, FavoriteStation, WeatherType } from "@/types/station"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function saveVisit(info: VisitInfo, userId: number) {
  console.log("Saving visit:", info, "for user:", userId)
  try {
    const result = await prisma.visit.create({
      data: {
        userId,
        stationId: info.stationId,
        stationName: info.name,
        date: new Date(info.date),
        weather: info.weather,
        memo: info.memo || "",
      },
    })
    console.log("Visit saved successfully:", result)
    return result
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
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        stationId: station.id,
      },
    })

    if (existingFavorite) {
      // If the station is already a favorite, remove it
      await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      })
    } else {
      // If the station is not a favorite, add it
      await prisma.favorite.create({
        data: {
          userId,
          stationId: station.id,
          stationName: station.name,
        },
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
    const favoriteStations = await prisma.favorite.findMany({
      where: { userId },
      include: {
        station: true,
      },
    })

    return favoriteStations.map((favorite) => ({
      id: favorite.stationId,
      name: favorite.stationName,
      lines: favorite.station.lines,
    }))
  } catch (error) {
    console.error("Error fetching favorite stations:", error)
    throw new Error("Failed to fetch favorite stations")
  }
}

export async function getVisitedStations(userId: number): Promise<VisitInfo[]> {
  try {
    const visitedStations = await prisma.visit.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    })

    return visitedStations.map((visit) => ({
      stationId: visit.stationId,
      name: visit.stationName,
      date: visit.date.toISOString().split("T")[0], // Convert Date to YYYY-MM-DD string
      weather: visit.weather as WeatherType, // Cast weather to WeatherType
      memo: visit.memo || "",
    }))
  } catch (error) {
    console.error("Error fetching visited stations:", error)
    throw new Error("Failed to fetch visited stations")
  }
}

