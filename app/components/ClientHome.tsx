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
import {
  getVisitsFromLocalStorage,
  saveFavoriteToLocalStorage,
  getFavoritesFromLocalStorage,
} from "@/src/utils/localStorage"
import type { Session } from "next-auth"
import { VisitedStations } from "@/components/visited-stations"
import { categoryMapping } from "@/lib/category-mapping"
import type { Category } from "@/types/category"

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
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleTabChange = (value: string) => {
    setActiveTabState(value)
    router.push(`/?tab=${value}`, { scroll: false })
  }

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
        const categoriesParam = encodeURIComponent(JSON.stringify(selectedCategories.map((cat) => cat.id)))
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
    [selectedCategories, fetchStation],
  )

  const updateStationSpots = useCallback(
    async (categories: { id: string; label: string; type: string }[]) => {
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
        // Set empty spots array to prevent undefined errors
        setStation((prevStation) => (prevStation ? { ...prevStation, spots: [] } : null))
      }
    },
    [station],
  )

  const loadFavorites = useCallback(async () => {
    if (status === "authenticated" && session?.user?.id) {
      try {
        const favs = await getFavoriteStations(Number.parseInt(session.user.id))
        setFavorites(favs)
      } catch (error) {
        console.error("お気に入りの取得エラー:", error)
        setError("お気に入りの取得に失敗しました")
      }
    } else {
      // Guest mode
      const guestFavorites = getFavoritesFromLocalStorage()
      setFavorites(guestFavorites)
    }
  }, [status, session?.user?.id])

  const handleToggleFavorite = async () => {
    if (!station) return

    if (status === "authenticated" && session?.user?.id) {
      try {
        const favoriteStation: FavoriteStation = {
          id: station.id,
          name: station.name,
          lines: station.lines || [],
        }
        const updatedFavorites = await toggleFavoriteStation(Number.parseInt(session.user.id), favoriteStation)
        setFavorites(updatedFavorites)
      } catch (error) {
        console.error("お気に入りの更新エラー:", error)
        setError("お気に入りの更新に失敗しました")
      }
    } else {
      // Guest mode
      const favoriteStation: FavoriteStation = {
        id: station.id,
        name: station.name,
        lines: station.lines || [],
      }
      saveFavoriteToLocalStorage(favoriteStation)
      loadFavorites()
    }
  }

  const handleSelectFavorite = (selectedStation: FavoriteStation) => {
    handleTabChange("picker")
    pickStation(selectedStation.id)
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true)
  }

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login", redirect: true })
    } catch (error) {
      console.error("Logout error:", error)
      setError("ログアウトに失敗しました")
    }
  }

  const handleCategoryChange = async (newCategories: Category[]) => {
    setSelectedCategories(newCategories)
    if (status === "authenticated") {
      try {
        console.log("Sending categories update:", newCategories)
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categories: newCategories.filter((cat) => !cat.id.startsWith("custom_")).map((cat) => cat.id),
            customCategories: newCategories.filter((cat) => cat.id.startsWith("custom_")),
          }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          throw new Error(errorData.error || "Failed to update categories")
        }
        const result = await response.json()
        console.log("Category update result:", result)
      } catch (error) {
        console.error("Error updating categories:", error)
        setError("カテゴリーの更新に失敗しました")
      }
    } else {
      localStorage.setItem("selectedSpotCategories", JSON.stringify(newCategories))
    }
    updateStationSpots(newCategories as { id: string; label: string; type: string }[])
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
    const fetchCategories = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/categories")
          if (response.ok) {
            const data = await response.json()
            setSelectedCategories(data.categories)
          } else {
            throw new Error("Failed to fetch categories")
          }
        } catch (error) {
          console.error("Error fetching categories:", error)
          setError("カテゴリーの取得に失敗しました")
        }
      } else {
        const storedCategories = localStorage.getItem("selectedSpotCategories")
        if (storedCategories) {
          setSelectedCategories(JSON.parse(storedCategories))
        } else {
          const defaultCategories = Object.values(categoryMapping).slice(0, 4)
          setSelectedCategories(defaultCategories)
          localStorage.setItem("selectedSpotCategories", JSON.stringify(defaultCategories))
        }
      }
    }

    fetchCategories()
  }, [status])

  useEffect(() => {
    const loadVisitedStations = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const stations = await getVisitedStations(Number.parseInt(session.user.id))
          setVisitedStations(stations)
        } catch (error) {
          console.error("Error fetching visited stations:", error)
          setError("Failed to fetch visited stations")
        }
      } else {
        // Guest mode
        const guestVisits = getVisitsFromLocalStorage()
        setVisitedStations(guestVisits)
      }
    }
    loadVisitedStations()
  }, [status, session?.user?.id])

  if (!isMounted) {
    return <div>Loading...</div>
  }

  const isFavorite = station ? favorites.some((fav) => fav.id === station.id) : false

  const Map = dynamic(() => import("@/components/map"), { ssr: false })

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
                    station.spots.map((spot, index) => (
                      <SpotCard key={`${spot.id}-${index}`} {...spot} onClick={() => setSelectedSpot(spot)} />
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

