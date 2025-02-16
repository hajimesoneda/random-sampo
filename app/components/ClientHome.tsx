"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Station, FavoriteStation } from "@/types/station"
import { toggleFavoriteStation, getFavoriteStations, getVisitedStations } from "@/app/actions/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Train, Star, Settings, LogOut, LogIn } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { SpotCard } from "@/components/spot-card"
import { FavoriteStations } from "@/components/favorite-stations"
import { SettingsModal } from "@/components/settings-modal"
import type { VisitInfo } from "@/types/station"
import { getVisitsFromLocalStorage, getFavoritesFromLocalStorage } from "@/src/utils/localStorage"
import type { Session } from "next-auth"
import { VisitedStations } from "@/components/visited-stations"
import { categoryMapping } from "@/lib/category-mapping"
import type { Category } from "@/types/category"
import { Badge } from "@/components/ui/badge"

interface ClientHomeProps {
  session?: Session | null
  isGuest?: boolean
}

export default function ClientHome({ session: initialSession, isGuest }: ClientHomeProps) {
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<FavoriteStation[]>([])
  const [activeTab, setActiveTabState] = useState<string>("picker")
  const [selectedSpot, setSelectedSpot] = useState<Station["spots"][0] | null>(null)
  const [stationKey, setStationKey] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [visitedStations, setVisitedStations] = useState<VisitInfo[]>([])
  const [randomizedCategories, setRandomizedCategories] = useState<Category[]>([])
  const { data: session, status } = useSession()
  const router = useRouter()

  // 初期化時のデフォルトカテゴリー設定
  const initializeDefaultCategories = useCallback(() => {
    const defaultCategories = [
      categoryMapping.cafe,
      categoryMapping.restaurant,
      categoryMapping.public_bath,
      categoryMapping.tourist_attraction,
    ]
    setSelectedCategories(defaultCategories)
    return defaultCategories
  }, [])

  const fetchStation = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const newStation = await response.json()
      if (!newStation || typeof newStation !== "object") {
        throw new Error("Invalid station data received")
      }
      return newStation
    } catch (error) {
      console.error("Station fetch error:", error)
      throw error
    }
  }, [])

  const pickStation = useCallback(
    async (stationId?: string) => {
      setLoading(true)
      setStation(null)
      setSelectedSpot(null)
      setError(null)

      try {
        // カテゴリーが設定されていない場合はデフォルトを使用
        const categoriesToUse =
          randomizedCategories.length > 0
            ? randomizedCategories
            : selectedCategories.length > 0
              ? selectedCategories
              : initializeDefaultCategories()

        const categoriesParam = encodeURIComponent(JSON.stringify(categoriesToUse.map((cat) => cat.id)))
        const url = stationId
          ? `/api/station/${encodeURIComponent(stationId)}?categories=${categoriesParam}`
          : `/api/random-station?categories=${categoriesParam}`

        const newStation = await fetchStation(url)
        setStation(newStation)
        setStationKey(Date.now().toString())
      } catch (error) {
        console.error("駅の取得エラー:", error)
        setError(
          error instanceof Error
            ? error.message
            : "駅の取得中にエラーが発生しました。しばらく待ってから再度お試しください。",
        )
      } finally {
        setLoading(false)
      }
    },
    [randomizedCategories, selectedCategories, fetchStation, initializeDefaultCategories],
  )

  // カテゴリーの初期化と取得
  useEffect(() => {
    const fetchCategories = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/categories")
          if (response.ok) {
            const data = await response.json()
            if (data.categories && data.categories.length > 0) {
              setSelectedCategories(data.categories)
            } else {
              // サーバーから空の配列が返された場合はデフォルトを設定
              initializeDefaultCategories()
            }
          } else {
            throw new Error("Failed to fetch categories")
          }
        } catch (error) {
          console.error("Error fetching categories:", error)
          initializeDefaultCategories()
        }
      } else if (isGuest) {
        const storedCategories = localStorage.getItem("selectedSpotCategories")
        if (storedCategories) {
          setSelectedCategories(JSON.parse(storedCategories))
        } else {
          initializeDefaultCategories()
        }
      }
    }

    if (isMounted) {
      fetchCategories()
    }
  }, [status, isGuest, isMounted, initializeDefaultCategories])

  // コンポーネントのマウント時の初期化
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const loadFavorites = useCallback(async () => {
    if (status === "authenticated") {
      try {
        const favorites = await getFavoriteStations()
        setFavorites(favorites)
      } catch (error) {
        console.error("Error loading favorites:", error)
        setError("お気に入りの読み込みに失敗しました")
      }
    } else if (isGuest) {
      const favorites = getFavoritesFromLocalStorage()
      setFavorites(favorites)
    }
  }, [status, isGuest])

  // 初期データの読み込み
  useEffect(() => {
    if (isMounted && (status === "authenticated" || isGuest)) {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get("tab")
      if (tabParam && ["picker", "visited", "favorites"].includes(tabParam)) {
        setActiveTabState(tabParam)
      }

      // カテゴリーが設定されている場合のみpickStationを実行
      if (selectedCategories.length > 0 || randomizedCategories.length > 0) {
        pickStation()
      }

      loadFavorites()
    }
  }, [isMounted, status, isGuest, pickStation, loadFavorites, selectedCategories, randomizedCategories])

  useEffect(() => {
    const loadVisits = async () => {
      if (isMounted && (status === "authenticated" || isGuest)) {
        try {
          const visits = status === "authenticated" ? await getVisitedStations() : getVisitsFromLocalStorage()
          setVisitedStations(visits)
        } catch (error) {
          console.error("Error loading visits:", error)
          setError("訪問履歴の読み込みに失敗しました")
        }
      }
    }
    loadVisits()
  }, [isMounted, status, isGuest])

  const handleSettingsClick = () => setIsSettingsOpen(true)
  const handleLogout = () => signOut()

  const handleTabChange = (value: string) => {
    setActiveTabState(value)
  }

  const handleToggleFavorite = async () => {
    if (!station) return
    const isFavorited = favorites.some((fav) => fav.id === station.id)
    try {
      const updatedFavorites = await toggleFavoriteStation(station.id, !isFavorited)
      setFavorites(updatedFavorites)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      setError("お気に入りの更新に失敗しました")
    }
  }

  const handleSelectFavorite = useCallback(
    async (stationId: string) => {
      setActiveTabState("picker")
      await pickStation(stationId)
    },
    [pickStation],
  )

  const handleCategoryChange = (categories: Category[]) => {
    setSelectedCategories(categories)
    localStorage.setItem("selectedSpotCategories", JSON.stringify(categories))
    // pickStation()の呼び出しを削除
  }

  if (!isMounted) {
    return <div>Loading...</div>
  }

  const isFavorite = station ? favorites.some((fav) => fav.id === station.id) : false
  const Map = dynamic(() => import("@/components/map"), { ssr: false })

  function getCategoryLabel(categoryId: string): string {
    const category = Object.values(categoryMapping).find((cat) => cat.id === categoryId)
    return category ? category.label : categoryId
  }

  return (
    <main className="container max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ランダム駅ピッカー</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">設定</span>
          </Button>
          {status === "authenticated" ? (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">ログアウト</span>
            </Button>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="icon">
                <LogIn className="h-5 w-5" />
                <span className="sr-only">ログイン</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {session?.user?.email ? (
        <p className="mb-4">ようこそ、{session.user.email}さん</p>
      ) : (
        <p className="mb-4">ゲストとして利用中</p>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">エラー: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="picker" className="flex-1">
            ピッカー
          </TabsTrigger>
          <TabsTrigger value="visited" className="flex-1">
            訪問済み
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex-1">
            お気に入り
          </TabsTrigger>
        </TabsList>

        <TabsContent value="picker">
          {loading ? (
            <div className="w-full h-[300px] bg-muted animate-pulse rounded-lg" />
          ) : station ? (
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">{station.name}駅</h2>
                <p className="text-sm text-gray-600 mb-2">
                  <Train className="inline-block mr-1" size={16} />
                  {station.lines.join("、")}
                </p>
                <Map
                  center={{ lat: station.lat, lng: station.lng }}
                  selectedSpot={selectedSpot}
                  stationKey={stationKey}
                />
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    if (station && selectedSpot) {
                      const origin = `${station.lat},${station.lng}`
                      const destination = `${selectedSpot.lat},${selectedSpot.lng}`
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`
                      window.open(url, "_blank")
                    } else {
                      window.open(`https://www.google.com/maps?q=${station.lat},${station.lng}`, "_blank")
                    }
                  }}
                >
                  Google Mapで開く
                </Button>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {station?.spots && station.spots.length > 0 ? (
                    station.spots.slice(0, 4).map(
                      (
                        spot,
                        index, // 最大4つのスポットに制限
                      ) => (
                        <div key={`${spot.id}-${index}`} className="relative">
                          <SpotCard {...spot} onClick={() => setSelectedSpot(spot)} index={index} />
                          <Badge className="absolute top-2 right-2 z-10">{getCategoryLabel(spot.type)}</Badge>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="col-span-2 text-center text-muted-foreground">
                      選択したカテゴリーのスポットが見つかりません
                    </p>
                  )}
                </div>
                <div className="mt-4 flex justify-between">
                  <Button onClick={() => pickStation()}>別の駅を選ぶ</Button>
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
                <Button onClick={() => pickStation()} className="mt-4">
                  駅を選ぶ
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visited">
          <VisitedStations visitedStations={visitedStations} />
        </TabsContent>

        <TabsContent value="favorites">
          <FavoriteStations favorites={favorites} onUpdate={setFavorites} onSelectStation={handleSelectFavorite} />
        </TabsContent>
      </Tabs>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCategoryChange={handleCategoryChange}
        initialCategories={selectedCategories}
      />
    </main>
  )
}

