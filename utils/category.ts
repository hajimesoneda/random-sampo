import { categoryMapping } from "@/lib/category-mapping"

export function getCategoryLabel(categoryId: string): string {
  const category = Object.values(categoryMapping).find((cat) => cat.id === categoryId)
  return category ? category.label : categoryId
}

