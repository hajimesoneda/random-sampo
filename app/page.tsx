'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Station, FavoriteStation } from '@/types/station'
import { Train, MapPin, Star } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SpotCard } from '@/components/spot-card'
import { VisitedStations } from '@/components/visited-stations'
import { FavoriteStations } from '@/components/favorite-stations'
import { Skeleton } from "@/components/ui/skeleton"
import { toggleFavoriteStation, getFavoriteStations } from '@/app/actions'

const Map = dynamic(() => import('@/components/map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted animate-pulse" />
})

export default function Home() {
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<FavoriteStation[]>([])
  const [activeTab, setActiveTab] = useState("picker")

  const pickStation = async (isInitialLoad = false, stationId?: string) => {
    if (!isInitialLoad) {
      setLoading(true)
      setStation(null)
    }
    setError(null)
    try {
      const url = stationId 
        ? `/api/station/${encodeURIComponent(stationId)}` 
        : '/api/random-station'
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '駅の取得に失敗しました')
      }
      const newStation = await response.json()
      setStation(newStation)
    } catch (error) {
      console.error('駅の取得エラー:', error)
      setError(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
      if (isInitialLoad) {
        setInitialLoad(false)
      }
    }
  }

  const loadFavorites = async () => {
    const favs = await getFavoriteStations()
    setFavorites(favs)
  }

  const handleToggleFavorite = async () => {
    if (station) {
      const favoriteStation: FavoriteStation = {
        id: station.id,
        name: station.name,
        lines: station.lines
      }
      const updatedFavorites = await toggleFavoriteStation(favoriteStation)
      setFavorites(updatedFavorites)
    }
  }

  const handleSelectFavorite = (selectedStation: FavoriteStation) => {
    setActiveTab("picker")
    pickStation(false, selectedStation.id)
  }

  useEffect(() => {
    pickStation(true)
    loadFavorites()
  }, [])

  const isFavorite = station ? favorites.some(fav => fav.id === station.id) : false

  return (
    <main className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ランダム駅ピッカー</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="picker" className="flex-1">ピッカー</TabsTrigger>
          <TabsTrigger value="visited" className="flex-1">訪問済み</TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">お気に入り</TabsTrigger>
        </TabsList>

        <TabsContent value="picker">
          <div className="space-y-4">
            <p className="text-muted-foreground">都内の駅をランダムに選びます</p>
            
            <Button 
              onClick={() => pickStation()} 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white h-16 text-lg font-bold"
              disabled={loading || initialLoad}
            >
              {loading || initialLoad ? '選択中...' : '駅のシャッフル！'}
            </Button>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

            <Card>
              <CardContent className="p-6 space-y-6">
                {(loading || initialLoad) ? (
                  <>
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="w-full h-[300px]" />
                    <Skeleton className="h-20 w-full" />
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-1/2" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </>
                ) : station ? (
                  <>
                    <h2 className="text-3xl font-bold text-center">{station.name}</h2>
                    
                    <Map center={{ lat: station.lat, lng: station.lng }} />

                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <h3 className="font-semibold mb-2">駅情報</h3>
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4" />
                        <span>路線: {station.lines.join('、')}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        周辺のおすすめスポット
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {station.spots.map((spot) => (
                          <SpotCard key={spot.id} name={spot.name} type={spot.type} photo={spot.photo} />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                        <Link href={`/visit/${encodeURIComponent(station.name)}`}>
                          行ってみた！
                        </Link>
                      </Button>
                      <Button 
                        variant={isFavorite ? "default" : "outline"} 
                        className="flex-1"
                        onClick={handleToggleFavorite}
                      >
                        <Star className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                        {isFavorite ? "お気に入り解除" : "お気に入り"}
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visited">
          <VisitedStations />
        </TabsContent>

        <TabsContent value="favorites">
          <FavoriteStations 
            favorites={favorites} 
            onUpdate={setFavorites} 
            onSelectStation={handleSelectFavorite}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}

