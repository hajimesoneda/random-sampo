import prisma from "@/lib/prisma"
import type { Category } from "@/types/category"

export async function getCustomCategories(userId: number): Promise<Category[]> {
  try {
    const userPreference = await prisma.categoryPreference.findUnique({
      where: { userId },
      select: { customCategories: true },
    })

    if (userPreference?.customCategories) {
      return JSON.parse(userPreference.customCategories as string)
    }

    return []
  } catch (error) {
    console.error("Error fetching custom categories:", error)
    return []
  }
}

