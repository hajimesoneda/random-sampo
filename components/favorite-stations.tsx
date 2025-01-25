import type { FavoriteStation } from "@/types/station"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Train, Star } from "lucide-react"
import { toggleFavoriteStation } from "@/app/actions/index"

interface FavoriteStationsProps {
  favorites: FavoriteStation[]
  onUpdate: (favorites: FavoriteStation[]) => void
  onSelectStation: (station: FavoriteStation) => void
}

export function FavoriteStations({ favorites, onUpdate, onSelectStation }: FavoriteStationsProps) {
  const handleToggleFavorite = async (station: FavoriteStation, event: React.MouseEvent) => {
    event.stopPropagation()
    const updatedFavorites = await toggleFavoriteStation(station)
    onUpdate(updatedFavorites)
  }

  if (favorites.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">お気に入りの駅がありません</div>
  }

  return (
    <div className="space-y-4">
      {favorites.map((station) => (
        <Card key={station.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectStation(station)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{station.name}駅</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Train className="w-4 h-4 mr-1" />
                  <span>{station.lines.join("、")}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => handleToggleFavorite(station, e)}>
                <Star className="w-5 h-5 fill-current text-yellow-400" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

