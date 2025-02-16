"use server"

import type { VisitInfo, FavoriteStation, WeatherType } from "@/types/station"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import prisma from "@/lib/prisma"

export async function saveVisit(info: VisitInfo, userId: number) {
  console.log("Saving visit:", info, "for user:", userId)
  try {
    const result = await prisma.visit.create({
      data: {
        userId,
        stationId: info.stationId,
        stationName: info.name, // Ensure this is correctly passed
        date: new Date(info.date),
        weather: info.weather,
        memo: info.memo || "",
      },
    })
    console.log("Visit saved successfully:", result)
    return result
  } catch (error) {
    console.error("Error saving visit:", error)
    throw new Error("訪問の保存に失敗しました")
  }
}

export async function saveVisitWithSession(info: VisitInfo) {
  console.log("Attempting to save visit with session")
  const session = await getServerSession(authOptions)
  console.log("Session in saveVisitWithSession:", JSON.stringify(session, null, 2))

  if (!session?.user?.id) {
    console.error("No user ID in session:", session)
    throw new Error("ログインが必要です")
  }

  try {
    const userId = Number.parseInt(session.user.id)
    console.log("User ID from session:", userId)
    return await saveVisit(info, userId)
  } catch (error) {
    console.error("Error in saveVisitWithSession:", error)
    throw error instanceof Error ? error : new Error("訪問の保存に失敗しました")
  }
}

export async function toggleFavoriteStation(stationId: string, isFavorite: boolean): Promise<FavoriteStation[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  const userId = Number.parseInt(session.user.id)

  try {
    if (isFavorite) {
      await prisma.favorite.create({
        data: {
          userId,
          stationId,
          stationName: "", // You might want to fetch the station name here
        },
      })
    } else {
      await prisma.favorite.deleteMany({
        where: {
          userId,
          stationId,
        },
      })
    }

    return getFavoriteStations()
  } catch (error) {
    console.error("Error toggling favorite station:", error)
    throw new Error("お気に入りの更新に失敗しました")
  }
}

export async function getFavoriteStations(): Promise<FavoriteStation[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  const userId = Number.parseInt(session.user.id)
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        station: true,
      },
    })

    return favorites.map((favorite) => ({
      id: favorite.stationId,
      name: favorite.stationName,
      lines: favorite.station.lines,
    }))
  } catch (error) {
    console.error("Error fetching favorite stations:", error)
    throw new Error("お気に入りの取得に失敗しました")
  }
}

export async function getVisitedStations(): Promise<VisitInfo[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  const userId = Number.parseInt(session.user.id)
  try {
    const visits = await prisma.visit.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    })

    return visits.map((visit) => ({
      stationId: visit.stationId,
      name: visit.stationName,
      date: visit.date.toISOString().split("T")[0],
      weather: visit.weather as WeatherType,
      memo: visit.memo || "",
    }))
  } catch (error) {
    console.error("Error fetching visited stations:", error)
    throw new Error("訪問履歴の取得に失敗しました")
  }
}

