export interface Category {
  id: string
}

export function isValidCategory(obj: any): obj is Category {
  return typeof obj === "object" && obj !== null && typeof obj.id === "string"
}

