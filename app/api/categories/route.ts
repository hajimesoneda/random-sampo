import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { categoryMapping } from "@/lib/category-mapping"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    // ログインしていない場合はデフォルトのカテゴリーを返す
    const defaultCategories = [
      categoryMapping.cafe,
      categoryMapping.restaurant,
      categoryMapping.public_bath,
      categoryMapping.tourist_attraction,
    ]
    return NextResponse.json({ categories: defaultCategories })
  }

  const userId = Number.parseInt(session.user.id)

  try {
    const userPreference = await prisma.categoryPreference.findUnique({
      where: { userId },
      include: { categories: true },
    })

    if (!userPreference) {
      // ユーザー設定が存在しない場合はデフォルトのカテゴリーを返す
      const defaultCategories = [
        categoryMapping.cafe,
        categoryMapping.restaurant,
        categoryMapping.public_bath,
        categoryMapping.tourist_attraction,
      ]
      return NextResponse.json({ categories: defaultCategories })
    }

    // データベースのカテゴリーをCategory型に変換
    const dbCategories = userPreference.categories.map((cat) => ({
      ...cat,
      type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
    }))

    // カスタムカテゴリーを解析して検証
    const customCategories = userPreference.customCategories
      ? (JSON.parse(userPreference.customCategories as string) as Category[])
      : []

    // すべてのカテゴリーを結合
    const allCategories = [...dbCategories, ...customCategories]

    return NextResponse.json({ categories: allCategories })
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
    // カスタムカテゴリーの構造を検証
    const validatedCustomCategories = customCategories.map((cat: Category) => ({
      id: String(cat.label),
      label: String(cat.label),
      type: String(cat.type),
    }))

    // データベースからすべてのカテゴリーを取得
    const dbCategories = await prisma.category.findMany()

    // ユーザーのカテゴリー設定を更新
    await prisma.categoryPreference.upsert({
      where: { userId },
      update: {
        categories: {
          set: categories
            .map((categoryId: string) => {
              const dbCategory = dbCategories.find((cat) => cat.id === categoryId)
              return dbCategory ? { id: dbCategory.id } : null
            })
            .filter(Boolean),
        },
        customCategories: JSON.stringify(validatedCustomCategories),
      },
      create: {
        userId,
        categories: {
          connect: categories
            .map((categoryId: string) => {
              const dbCategory = dbCategories.find((cat) => cat.id === categoryId)
              return dbCategory ? { id: dbCategory.id } : null
            })
            .filter(Boolean),
        },
        customCategories: JSON.stringify(validatedCustomCategories),
      },
    })

    // 更新されたカテゴリーを取得して返す
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

    const updatedCustomCategories = updatedPreference.customCategories
      ? (JSON.parse(updatedPreference.customCategories as string) as Category[])
      : []

    const allCategories = [...updatedDbCategories, ...updatedCustomCategories]

    return NextResponse.json({ success: true, categories: allCategories })
  } catch (error) {
    console.error("Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 })
  }
}

