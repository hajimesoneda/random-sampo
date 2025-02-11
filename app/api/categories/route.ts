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

  try {
    // First, ensure all categories exist
    const existingCategories = await prisma.category.findMany({
      where: {
        id: {
          in: categories,
        },
      },
    })

    if (existingCategories.length !== categories.length) {
      console.error(
        "Some categories do not exist:",
        categories.filter((id) => !existingCategories.some((cat) => cat.id === id)),
      )
      return NextResponse.json({ error: "Some categories do not exist" }, { status: 400 })
    }

    // Now perform the upsert operation
    await prisma.categoryPreference.upsert({
      where: { userId },
      update: {
        categories: {
          set: categories.map((id: string) => ({ id })),
        },
        customCategories: customCategories || [],
      },
      create: {
        userId,
        categories: {
          connect: categories.map((id: string) => ({ id })),
        },
        customCategories: customCategories || [],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 })
  }
}

	