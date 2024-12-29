import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Camera, Coffee, Utensils } from 'lucide-react'
import Image from 'next/image'

interface SpotCardProps {
  name: string
  type: string
  photo: string | null
}

export function SpotCard({ name, type, photo }: SpotCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'tourist_attraction':
        return <Camera className="w-4 h-4" />;
      case 'cafe':
        return <Coffee className="w-4 h-4" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  }

  const getTypeName = () => {
    switch (type) {
      case 'tourist_attraction':
        return '観光スポット';
      case 'cafe':
        return 'カフェ';
      case 'restaurant':
        return 'レストラン';
      default:
        return type;
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3]">
          {photo ? (
            <Image
              src={photo}
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
              <p className="text-sm text-muted-foreground">{getTypeName()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

