import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Camera, Coffee, Utensils, Droplet } from "lucide-react"
import Image from "next/image"

interface SpotCardProps {
  name: string
  type: string
  photo: string | null
  onClick?: () => void
  categoryLabel: string
}

export function SpotCard({ name, type, photo, onClick, categoryLabel }: SpotCardProps) {
  const getIcon = () => {
    switch (type) {
      case "tourist_attraction":
        return <Camera className="w-4 h-4" />
      case "cafe":
        return <Coffee className="w-4 h-4" />
      case "restaurant":
        return <Utensils className="w-4 h-4" />
      case "public_bath":
        return <Droplet className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getTypeName = () => {
    switch (type) {
      case "tourist_attraction":
        return "観光スポット"
      case "cafe":
        return "カフェ"
      case "restaurant":
        return "レストラン"
      case "public_bath":
        return "銭湯"
      default:
        return type
    }
  }

  return (
    <Card className="overflow-hidden cursor-pointer" onClick={onClick}>
      <CardContent className="p-0">
        <div className="relative aspect-[4/3]">
          {photo ? (
            <Image
              src={photo || "/placeholder.svg"}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start gap-2">
            {getIcon()}
            <div>
              <h4 className="font-medium leading-tight">{name}</h4>
              <p className="text-sm text-muted-foreground">{categoryLabel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

