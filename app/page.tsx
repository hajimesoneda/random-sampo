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
      if (!newStation || typeof newStation !== 'object') {
        throw new Error('Invalid station data received')
      }
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
    try {
      const favs = await getFavoriteStations()
      setFavorites(favs)
    } catch (error) {
      console.error('お気に入りの取得エラー:', error)
      setError('お気に入りの取得に失敗しました')
    }
  }

  const handleToggleFavorite = async () => {
    if (station) {
      try {
        const favoriteStation: FavoriteStation = {
          id: station.id,
          name: station.name,
          lines: station.lines
        }
        const updatedFavorites = await toggleFavoriteStation(favoriteStation)
        setFavorites(updatedFavorites)
      } catch (error) {
        console.error('お気に入りの更新エラー:', error)
        setError('お気に入りの更新に失敗しました')
      }
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
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="picker" className="flex-1">ピッカー</TabsTrigger>
          <TabsTrigger value="visited" className="flex-1">訪問済み</TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">お気に入り</TabsTrigger>
        </TabsList>

        <TabsContent value="picker">
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ) : station ? (
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">{station.name}駅</h2>
                <p className="text-sm text-gray-600 mb-4">
                  <Train className="inline-block mr-1" size={16} />
                  {station.lines.join('、')}
                </p>
                <Map center={{ lat: station.lat, lng: station.lng }} />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => window.open(`https://www.google.com/maps?q=${station.lat},${station.lng}`, '_blank')}
                >
                  Google Mapで開く
                </Button>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {station.spots.map((spot) => (
                    <SpotCard key={spot.id} {...spot} />
                  ))}
                </div>
                <div className="mt-4 flex justify-between">
                  <Button onClick={() => pickStation(false)}>別の駅を選ぶ</Button>
                  <Button variant="outline" onClick={handleToggleFavorite}>
                    {isFavorite ? (
                      <>
                        <Star className="mr-2 h-4 w-4 fill-current" /> お気に入り解除
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-4 w-4" /> お気に入りに追加
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-4">
                  <Link href={`/visit/${encodeURIComponent(station.id)}`}>
                    <Button className="w-full">訪問を記録</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <p>駅が選択されていません</p>
                <Button onClick={() => pickStation(false)} className="mt-4">駅を選ぶ</Button>
              </CardContent>
            </Card>
          )}
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

