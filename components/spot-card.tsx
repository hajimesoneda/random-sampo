"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { categoryMapping } from "@/lib/category-mapping"
import { motion } from "framer-motion"

interface SpotCardProps {
  id?: string
  name?: string
  lat?: number
  lng?: number
  type?: string
  photo?: string
  onClick?: () => void
  isLoading?: boolean
  index: number
}

export function SpotCard({ name, photo, type, onClick, isLoading, index }: SpotCardProps) {
  const [imageError, setImageError] = useState(false)
  const category = type ? Object.values(categoryMapping).find((cat) => cat.id === type) : null
  const categoryLabel = category?.label || type

  const handleImageError = () => {
    console.error("Image failed to load:", photo)
    setImageError(true)
  }

  const imageUrl =
    photo && (photo.startsWith("http") || photo.startsWith("/placeholder.svg"))
      ? photo
      : `/api/place-photo?reference=${encodeURIComponent(photo || "")}`

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.2 }}>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Skeleton className="aspect-square w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.2 }}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-3">
          <div className="aspect-square relative mb-2">
            <Image
              src={imageError ? "/placeholder.svg?height=400&width=400" : imageUrl}
              alt={name || ""}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover rounded-md"
              onError={handleImageError}
              unoptimized={!imageUrl.startsWith("/placeholder.svg")}
            />
          </div>
          <h3 className="font-semibold text-sm truncate">{name}</h3>
          {categoryLabel && (
            <Badge variant="secondary" className="mt-1">
              {categoryLabel}
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

