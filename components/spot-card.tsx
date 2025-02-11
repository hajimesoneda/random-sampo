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
  const category = Object.values(categoryMapping).find((cat) => cat.type === type)
  const categoryLabel = category?.label || type

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="aspect-square relative mb-2">
          <Image
            src={photo || "/placeholder.svg?height=400&width=400"}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover rounded-md"
          />
        </div>
        <h3 className="font-semibold text-sm truncate">{name}</h3>
        <p className="text-xs text-muted-foreground">{categoryLabel}</p>
      </CardContent>
    </Card>
  )
}

