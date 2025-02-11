import type { Category } from "@/types/category"

export const categoryMapping: Record<string, Category> = {
  cafe: {
    id: "cafe",
    label: "カフェ",
    type: "cafe",
  },
  restaurant: {
    id: "restaurant",
    label: "レストラン",
    type: "restaurant",
  },
  public_bath: {
    id: "public_bath",
    label: "銭湯",
    type: ["spa", "onsen"],
    keywords: "銭湯,温泉,スーパー銭湯",
  },
  tourist_attraction: {
    id: "tourist_attraction",
    label: "観光スポット",
    type: "tourist_attraction",
  },
  park: {
    id: "park",
    label: "公園",
    type: "park",
  },
  museum: {
    id: "museum",
    label: "美術館・博物館",
    type: "museum",
  },
  shopping_mall: {
    id: "shopping_mall",
    label: "ショッピングモール",
    type: "shopping_mall",
  },
  amusement_park: {
    id: "amusement_park",
    label: "遊園地",
    type: "amusement_park",
  },
}

export type CategoryId = keyof typeof categoryMapping

export function getCategoryType(id: string): string | string[] {
  const category = categoryMapping[id as CategoryId]
  return category ? category.type : id
}

export function getCategoryKeywords(id: string): string | undefined {
  const category = categoryMapping[id as CategoryId]
  return category?.keywords
}

