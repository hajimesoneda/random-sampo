import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Train } from "lucide-react"
import type { FavoriteStation } from "@/types/station"
import { useSession } from "next-auth/react"
import { toggleFavoriteStation } from "@/app/actions/index"

interface FavoriteStationsProps {
  favorites: FavoriteStation[]
  onUpdate: (favorites: FavoriteStation[]) => void
  onSelectStation: (stationId: string) => void
}

export function FavoriteStations({ favorites, onUpdate, onSelectStation }: FavoriteStationsProps) {
  const { data: session } = useSession()

  const handleToggleFavorite = async (station: FavoriteStation, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!session?.user?.id) {
      console.error("User not authenticated")
      return
    }
    try {
      const updatedFavorites = await toggleFavoriteStation(station.id, true)
      onUpdate(updatedFavorites)
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  return (
    <div className="space-y-4">
      {favorites.length === 0 ? (
        <p className="text-center text-muted-foreground">お気に入りの駅はありません</p>
      ) : (
        favorites.map((station) => (
          <Card key={station.id} className="cursor-pointer" onClick={() => onSelectStation(station.id)}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{station.name}駅</h3>
                <p className="text-sm text-muted-foreground">
                  <Train className="inline-block mr-1" size={16} />
                  {station.lines.join("、")}
                </p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={(e) => handleToggleFavorite(station, e)}>
                  <Star className="mr-2 h-4 w-4" />
                  お気に入り解除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

