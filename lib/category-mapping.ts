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
    keywords: "観光地,名所,観光スポット,神社,寺,史跡",
  },
  park: {
    id: "park",
    label: "公園",
    type: "park",
    keywords: "公園,庭園",
  },
  museum: {
    id: "museum",
    label: "美術館・博物館",
    type: "museum",
    keywords: "美術館,博物館,資料館",
  },
  shopping_mall: {
    id: "shopping_mall",
    label: "ショッピングモール",
    type: "shopping_mall",
    keywords: "ショッピングモール,商業施設,ショッピングセンター",
  },
  amusement_park: {
    id: "amusement_park",
    label: "遊園地",
    type: "amusement_park",
    keywords: "遊園地,テーマパーク",
  },
}

export type CategoryId = keyof typeof categoryMapping

export function isCustomCategory(type: string): boolean {
  return !Object.values(categoryMapping).some((cat) => cat.id === type)
}

export function getCategoryType(label: string): string | string[] {
  const category = Object.values(categoryMapping).find((cat) => cat.label === label)
  if (category) {
    return category.type
  }
  // カスタムカテゴリーの場合、point_of_interestを返す
  return "point_of_interest"
}

export function getCategoryKeywords(label: string): string | undefined {
  const category = Object.values(categoryMapping).find((cat) => cat.label === label)
  if (category?.keywords) {
    return category.keywords
  }
  // カスタムカテゴリーの場合、ラベルをそのままキーワードとして使用
  return label
}

