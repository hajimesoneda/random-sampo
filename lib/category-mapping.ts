import type { Category } from "@/types/category"

export const categoryMapping: Record<string, Category> = {
  cafe: {
    id: "cafe",
    label: "カフェ",
    type: "cafe",
    keywords: "カフェ,喫茶店",
  },
  restaurant: {
    id: "restaurant",
    label: "レストラン",
    type: "restaurant",
    keywords: "レストラン,食事処",
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
  hotel: {
    id: "hotel",
    label: "ホテル",
    type: "lodging",
    keywords: "ホテル,旅館",
  },
  shopping: {
    id: "shopping",
    label: "ショッピング",
    type: "shopping_mall",
    keywords: "商店街,ショッピング,市場",
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
}

export function getCategoryKeywords(type: string): string {
  const category = Object.values(categoryMapping).find((cat) => cat.id === type)
  return category?.keywords || type
}

