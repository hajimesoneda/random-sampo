'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Station } from '@/types/station'
import { Train, MapPin } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SpotCard } from '@/components/spot-card'
import { VisitedStations } from '@/components/visited-stations'
import { Skeleton } from "@/components/ui/skeleton"

const Map = dynamic(() => import('@/components/map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted animate-pulse" />
})

export default function Home() {
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pickStation = async (isInitialLoad = false) => {
    if (!isInitialLoad) {
      setLoading(true)
      setStation(null)
    }
    setError(null)
    try {
      const response = await fetch('/api/random-station')
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

  useEffect(() => {
    pickStation(true)
  }, [])

  return (
    <main className="container max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ランダム駅ピッカー</h1>
      
      <Tabs defaultValue="picker">
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
              className="w-full"
              disabled={loading || initialLoad}
            >
              {loading || initialLoad ? '選択中...' : '選ぶ！'}
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
                      <Button asChild className="flex-1">
                        <Link href={`/visit/${encodeURIComponent(station.name)}`}>
                          行ってみた！
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex-1">
                        お気に入り
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
          <p className="text-center text-muted-foreground">お気に入りの駅がここに表示されます</p>
        </TabsContent>
      </Tabs>
    </main>
  )
}

