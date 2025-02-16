"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { categoryMapping } from "@/lib/category-mapping"

interface SpotCardProps {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  photo: string
  onClick: () => void
  index?: number
}

export function SpotCard({ name, photo, type, onClick, index }: SpotCardProps) {
  const [imageError, setImageError] = useState(false)
  const category = Object.values(categoryMapping).find((cat) => cat.id === type)
  const categoryLabel = category?.id || type

  const handleImageError = () => {
    console.error(`Image failed to load for ${name} (${type}):`, photo)
    setImageError(true)
  }

  // 画像URLの生成ロジックを改善
  const getImageUrl = () => {
    if (imageError) {
      return `/placeholder.svg?height=400&width=400`
    }

    if (photo.startsWith("http") || photo.startsWith("/")) {
      return photo
    }

    try {
      // photo_referenceが有効な文字列かチェック
      if (typeof photo !== "string" || photo.trim() === "") {
        console.error(`Invalid photo reference for ${name} (${type})`)
        return `/placeholder.svg?height=400&width=400`
      }

      return `/api/place-photo?reference=${encodeURIComponent(photo)}`
    } catch (error) {
      console.error(`Error creating image URL for ${name} (${type}):`, error)
      return `/placeholder.svg?height=400&width=400`
    }
  }

  const imageUrl = getImageUrl()
  console.log(`Rendering SpotCard for ${name} (${type}) with image URL:`, imageUrl)

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="aspect-square relative mb-2">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-md"
            onError={handleImageError}
            unoptimized={!imageUrl.startsWith("/placeholder.svg")}
          />
        </div>
        <h3 className="font-semibold text-sm truncate">{name}</h3>
        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
      </CardContent>
    </Card>
  )
}

