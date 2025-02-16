import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"
import { categoryMapping } from "@/lib/category-mapping"

// デフォルトのカテゴリー
const defaultCategories = [
  categoryMapping.cafe,
  categoryMapping.restaurant,
  categoryMapping.public_bath,
  categoryMapping.tourist_attraction,
]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // ログインしていない場合はデフォルトのカテゴリーを返す
    if (!session?.user?.id) {
      return NextResponse.json({ categories: defaultCategories })
    }

    const userId = Number.parseInt(session.user.id)

    const userPreference = await prisma.categoryPreference.findUnique({
      where: { userId },
      include: { categories: true },
    })

    // ユーザー設定が存在しない場合はデフォルトのカテゴリーを返す
    if (!userPreference) {
      return NextResponse.json({ categories: defaultCategories })
    }

    // データベースのカテゴリーをCategory型に変換
    const dbCategories = userPreference.categories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      keywords: cat.keywords || undefined,
    }))

    // カスタムカテゴリーを解析
    let customCategories: Category[] = []
    if (userPreference.customCategories) {
      try {
        const parsed = JSON.parse(userPreference.customCategories as string)
        if (Array.isArray(parsed)) {
          customCategories = parsed.map((cat) => ({
            id: String(cat.id),
            label: String(cat.label),
            type: Array.isArray(cat.type) ? cat.type : String(cat.type),
            keywords: cat.keywords ? String(cat.keywords) : undefined,
          }))
        }
      } catch (error) {
        console.error("Error parsing custom categories:", error)
        customCategories = []
      }
    }

    // すべてのカテゴリーを結合
    const allCategories = [...dbCategories, ...customCategories]

    // カテゴリーが空の場合はデフォルトを返す
    if (allCategories.length === 0) {
      return NextResponse.json({ categories: defaultCategories })
    }

    return NextResponse.json({ categories: allCategories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    // エラーが発生した場合はデフォルトのカテゴリーを返す
    return NextResponse.json({ categories: defaultCategories })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number.parseInt(session.user.id)
    const body = await request.json()

    if (!body || !Array.isArray(body.categories)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { categories, customCategories } = body

    // カスタムカテゴリーの構造を検証
    const validatedCustomCategories = Array.isArray(customCategories)
      ? customCategories.map((cat: any) => ({
          id: String(cat.label),
          label: String(cat.label),
          type: String(cat.type),
          keywords: cat.keywords ? String(cat.keywords) : undefined,
        }))
      : []

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
      id: cat.id,
      label: cat.label,
      type: cat.type.includes(",") ? cat.type.split(",") : cat.type,
      keywords: cat.keywords || undefined,
    }))

    const updatedCustomCategories = updatedPreference.customCategories
      ? JSON.parse(updatedPreference.customCategories as string)
      : []

    const allCategories = [...updatedDbCategories, ...updatedCustomCategories]

    return NextResponse.json({ success: true, categories: allCategories })
  } catch (error) {
    console.error("Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 })
  }
}

