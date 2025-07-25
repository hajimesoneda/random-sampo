export interface Category {
  id: string
  label: string
  type: string | string[]
  keywords?: string
}

export function isValidCategory(obj: any): obj is Category {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.id === "string" &&
    typeof obj.label === "string" &&
    (typeof obj.type === "string" || Array.isArray(obj.type)) &&
    (obj.keywords === undefined || typeof obj.keywords === "string")
  )
}

