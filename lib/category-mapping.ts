import type { Category } from "@/types/category"

export const categoryMapping: Record<string, Category> = {
  cafe: { id: "カフェ" },
  restaurant: { id: "レストラン" },
  public_bath: { id: "銭湯" },
  tourist_attraction: { id: "観光スポット" },
  hotel: { id: "ホテル" },
  shopping: { id: "ショッピング" },
  park: { id: "公園" },
  museum: { id: "美術館・博物館" },
}

export function isCustomCategory(id: string): boolean {
  return !Object.values(categoryMapping).some((cat) => cat.id === id)
}

