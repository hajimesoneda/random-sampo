import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ categories: [] }, { status: 401 })
  }

  const userId = Number.parseInt(session.user.id)

  try {
    const userPreference = await prisma.categoryPreference.findUnique({
      where: { userId },
      include: { categories: true },
    })

    if (!userPreference) {
      const defaultCategories = await prisma.category.findMany({
        take: 4,
      })
      return NextResponse.json({ categories: defaultCategories })
    }

    // Convert database categories to Category type
    const dbCategories = userPreference.categories.map((cat) => ({
      ...cat,
      type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
    }))

    // Parse and validate custom categories
    const customCategories = userPreference.customCategories
      ? (userPreference.customCategories as any[]).map(
          (cat) =>
            ({
              id: String(cat.id),
              label: String(cat.label),
              type: String(cat.type),
              keywords: cat.keywords ? String(cat.keywords) : undefined,
            }) as Category,
        )
      : []

    const categories = [...dbCategories, ...customCategories]

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = Number.parseInt(session.user.id)
  const { categories, customCategories } = await request.json()

  console.log("Received data:", { userId, categories, customCategories })

  try {
    // Validate custom categories structure
    const validatedCustomCategories = (customCategories || []).map((cat: any) => ({
      id: String(cat.id),
      label: String(cat.label),
      type: String(cat.type),
      keywords: cat.keywords ? String(cat.keywords) : undefined,
    }))

    // Fetch all categories from the database
    const dbCategories = await prisma.category.findMany()

    // Update the user's category preference
    const result = await prisma.categoryPreference.upsert({
      where: { userId },
      update: {
        categories: {
          set: categories
            .map((label: string) => {
              const dbCategory = dbCategories.find((cat) => cat.label === label)
              return dbCategory ? { id: dbCategory.id } : null
            })
            .filter(Boolean),
        },
        customCategories: validatedCustomCategories,
      },
      create: {
        userId,
        categories: {
          connect: categories
            .map((label: string) => {
              const dbCategory = dbCategories.find((cat) => cat.label === label)
              return dbCategory ? { id: dbCategory.id } : null
            })
            .filter(Boolean),
        },
        customCategories: validatedCustomCategories,
      },
    })

    console.log("Upsert result:", result)

    // Fetch updated categories to return
    const updatedPreference = await prisma.categoryPreference.findUnique({
      where: { userId },
      include: { categories: true },
    })

    if (!updatedPreference) {
      throw new Error("Failed to fetch updated categories")
    }

    const updatedDbCategories = updatedPreference.categories.map((cat) => ({
      ...cat,
      type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
    }))

    const allCategories = [...updatedDbCategories, ...validatedCustomCategories]

    return NextResponse.json({ success: true, categories: allCategories })
  } catch (error) {
    console.error("Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories", details: error }, { status: 500 })
  }
}

