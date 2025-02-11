import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import prisma from "@/lib/prisma"

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

    const categories = [
      ...userPreference.categories,
      ...((userPreference.customCategories as { id: string; label: string; type: string }[]) || []),
    ]

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
    // Ensure all categories exist in the database
    for (const categoryId of categories) {
      await prisma.category.upsert({
        where: { id: categoryId },
        update: {},
        create: { id: categoryId, label: categoryId, type: categoryId },
      })
    }

    // Fetch existing categories to ensure they're valid
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categories } },
    })

    const validCategoryIds = existingCategories.map((cat) => cat.id)

    // Update the user's category preference
    const result = await prisma.categoryPreference.upsert({
      where: { userId },
      update: {
        categories: {
          set: validCategoryIds.map((id) => ({ id })),
        },
        customCategories: customCategories || [],
      },
      create: {
        userId,
        categories: {
          connect: validCategoryIds.map((id) => ({ id })),
        },
        customCategories: customCategories || [],
      },
    })

    console.log("Upsert result:", result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories", details: error }, { status: 500 })
  }
}

