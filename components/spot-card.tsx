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
}

export function SpotCard({ name, photo, type, onClick }: SpotCardProps) {
  const [imageError, setImageError] = useState(false)
  const category = Object.values(categoryMapping).find((cat) => cat.type === type)
  const categoryLabel = category?.label || type

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="aspect-square relative mb-2">
          <Image
            src={imageError ? "/placeholder.svg?height=400&width=400" : photo}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-md"
            onError={handleImageError}
          />
        </div>
        <h3 className="font-semibold text-sm truncate">{name}</h3>
        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
      </CardContent>
    </Card>
  )
}

