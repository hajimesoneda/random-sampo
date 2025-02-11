export const categoryMapping = {
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
    type: "spa",
  },
  tourist_attraction: {
    id: "tourist_attraction",
    label: "観光スポット",
    type: "tourist_attraction",
  },
}

export type CategoryId = keyof typeof categoryMapping

