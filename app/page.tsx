'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Station } from '@/types/station'
import { Clock, Users, Train, MapPin } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SpotCard } from '@/components/spot-card'

const Map = dynamic(() => import('@/components/map'), { 
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted animate-pulse" />
})

export default function Home() {
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickStation = async () => {
    setLoading(true)
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
    }
  }

  useEffect(() => {
    pickStation()
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
              onClick={pickStation} 
              className="w-full"
              disabled={loading}
            >
              {loading ? '選択中...' : '選ぶ！'}
            </Button>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

            {station && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-3xl font-bold text-center">{station.name}</h2>
                  
                  <Map center={{ lat: station.lat, lng: station.lng }} />

                  {(station.passengers !== null || station.firstDeparture !== null) ? (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <h3 className="font-semibold mb-2">駅情報</h3>
                      <div className="flex items-center gap-2">
                        <Train className="w-4 h-4" />
                        <span>路線: {station.lines.join('、')}</span>
                      </div>
                      {station.passengers !== null && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>1日の乗降者数: 約{station.passengers.toLocaleString()}人</span>
                        </div>
                      )}
                      {station.firstDeparture !== null && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>始発: {station.firstDeparture}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg" role="alert">
                      <p className="font-bold">注意</p>
                      <p>この駅の詳細情報は現在利用できません。</p>
                    </div>
                  )}

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
                      <Link href={`/visit/${station.id}`}>
                        行ってみた！
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      お気に入り
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="visited">
          <p className="text-center text-muted-foreground">訪問済みの駅がここに表示されます</p>
        </TabsContent>

        <TabsContent value="favorites">
          <p className="text-center text-muted-foreground">お気に入りの駅がここに表示されます</p>
        </TabsContent>
      </Tabs>
    </main>
  )
}

