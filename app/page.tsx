"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Station, FavoriteStation, Spot } from "@/types/station"
import type { UserWithoutPassword } from "@/types/user"
import { Train, Star, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { SpotCard } from "@/components/spot-card"
import { useRouter } from "next/navigation"
import { FavoriteStations } from "@/components/favorite-stations"
import { toggleFavoriteStation, getFavoriteStations } from "@/app/actions/index"
import { SettingsModal } from "@/components/settings-modal"

const VisitedStations = dynamic(() => import("@/components/visited-stations"), {
  ssr: false,
})

const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted animate-pulse" />,
})

export default function Home() {
  const router = useRouter()
  const [station, setStation] = useState<Station | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<FavoriteStation[]>([])
  const [activeTab, setActiveTabState] = useState<string>("picker")
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [stationKey, setStationKey] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<{ id: string; label: string }[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [user, setUser] = useState<UserWithoutPassword | null>(null)

  const handleTabChange = (value: string) => {
    setActiveTabState(value)
    router.push(`/?tab=${value}`, { scroll: false })
  }

  const fetchStation = useCallback(async (url: string) => {
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
  }, [])

  const pickStation = useCallback(
    async (stationId?: string) => {
      setLoading(true)
      setStation(null)
      setSelectedSpot(null)
      setError(null)
      try {
        const categoriesParam = encodeURIComponent(JSON.stringify(selectedCategories.map((cat) => cat.id)))
        const url = stationId
          ? `/api/station/${encodeURIComponent(stationId)}?categories=${categoriesParam}`
          : `/api/random-station?categories=${categoriesParam}`

        const newStation = await fetchStation(url)
        setStation(newStation)
        setStationKey(Date.now().toString())
      } catch (error) {
        console.error("駅の取得エラー:", error)
        setError(error instanceof Error ? error.message : "予期せぬエラーが発生しました")
      } finally {
        setLoading(false)
      }
    },
    [selectedCategories, fetchStation],
  )

  const updateStationSpots = useCallback(
    async (categories: { id: string; label: string }[]) => {
      if (!station) return

      try {
        const categoriesParam = encodeURIComponent(JSON.stringify(categories.map((cat) => cat.id)))
        const url = `/api/station/${encodeURIComponent(station.id)}/spots?categories=${categoriesParam}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setStation((prevStation) => (prevStation ? { ...prevStation, spots: data.spots } : null))
        setStationKey(Date.now().toString())
      } catch (error) {
        console.error("スポットの更新エラー:", error)
        setError(error instanceof Error ? error.message : "スポットの更新に失敗しました")
      }
    },
    [station],
  )

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await getFavoriteStations()
      setFavorites(favs)
    } catch (error) {
      console.error("お気に入りの取得エラー:", error)
      setError("お気に入りの取得に失敗しました")
    }
  }, [])

  const handleToggleFavorite = async () => {
    if (station) {
      try {
        const favoriteStation: FavoriteStation = {
          id: station.id,
          name: station.name,
          lines: station.lines || [],
        }
        const updatedFavorites = await toggleFavoriteStation(favoriteStation)
        setFavorites(updatedFavorites)
      } catch (error) {
        console.error("お気に入りの更新エラー:", error)
        setError("お気に入りの更新に失敗しました")
      }
    }
  }

  const handleSelectFavorite = (selectedStation: FavoriteStation) => {
    handleTabChange("picker")
    pickStation(selectedStation.id)
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleCategoryChange = (newCategories: { id: string; label: string }[]) => {
    setSelectedCategories(newCategories)
    localStorage.setItem("selectedSpotCategories", JSON.stringify(newCategories))
    updateStationSpots(newCategories)
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user)
            setIsMounted(true)
          } else {
            localStorage.removeItem("token")
            router.push("/login")
          }
        })
        .catch((error) => {
          console.error("Failed to fetch user:", error)
          localStorage.removeItem("token")
          router.push("/login")
        })
    }
  }, [router])

  useEffect(() => {
    if (isMounted) {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get("tab")
      if (tabParam && ["picker", "visited", "favorites"].includes(tabParam)) {
        setActiveTabState(tabParam)
      }
      pickStation()
      loadFavorites()
    }
  }, [isMounted, pickStation, loadFavorites])

  useEffect(() => {
    const defaultCategories = [
      { id: "cafe", label: "カフェ" },
      { id: "restaurant", label: "レストラン" },
      { id: "public_bath", label: "銭湯" },
      { id: "tourist_attraction", label: "観光スポット" },
    ]

    const storedCategories = localStorage.getItem("selectedSpotCategories")
    if (storedCategories) {
      const parsedCategories = JSON.parse(storedCategories)
      setSelectedCategories(parsedCategories)
    } else {
      setSelectedCategories(defaultCategories)
      localStorage.setItem("selectedSpotCategories", JSON.stringify(defaultCategories))
    }
  }, [])

  if (!isMounted || !user) {
    return null
  }

  const isFavorite = station ? favorites.some((fav) => fav.id === station.id) : false

  return (
    <main className="container max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">ランダム駅ピッカー</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleSettingsClick}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">設定</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">ログアウト</span>
          </Button>
        </div>
      </div>

      {user && <p className="mb-4">ようこそ、{user.email}さん</p>}

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
                  {station.spots && station.spots.length > 0 ? (
                    station.spots.map((spot, index) => (
                      <SpotCard
                        key={`${spot.id}-${index}`}
                        {...spot}
                        onClick={() => setSelectedSpot(spot)}
                        categoryLabel={selectedCategories.find((cat) => cat.id === spot.type)?.label || spot.type}
                      />
                    ))
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
          <VisitedStations />
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

