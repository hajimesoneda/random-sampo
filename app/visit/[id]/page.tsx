"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveVisitWithSession } from "@/app/actions"
import { saveVisitToLocalStorage } from "@/src/utils/localStorage"
import type { WeatherType } from "@/types/station"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function VisitPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [date, setDate] = useState("")
  const [weather, setWeather] = useState<WeatherType>("unknown")
  const [memo, setMemo] = useState("")
  const [stationName, setStationName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchStationName()
  }, []) // Removed unnecessary dependency 'id'

  const fetchStationName = async () => {
    try {
      const response = await fetch(`/api/station/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch station data")
      }
      const data = await response.json()
      setStationName(data.name)
    } catch (error) {
      console.error("Error fetching station name:", error)
      setError("Failed to fetch station data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const visitInfo = {
        stationId: id,
        name: stationName,
        date,
        weather,
        memo,
      }

      if (status === "authenticated" && session?.user?.id) {
        await saveVisitWithSession(visitInfo)
      } else {
        saveVisitToLocalStorage(visitInfo)
      }

      router.push("/")
    } catch (error) {
      console.error("Error saving visit:", error)
      setError(error instanceof Error ? error.message : "訪問の保存に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">訪問を記録: {stationName}駅</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="date">日付</Label>
          <Input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSubmitting}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div>
          <Label htmlFor="weather">天気</Label>
          <Select value={weather} onValueChange={(value) => setWeather(value as WeatherType)}>
            <SelectTrigger>
              <SelectValue placeholder="天気を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">不明</SelectItem>
              <SelectItem value="☀️ 晴れ">☀️ 晴れ</SelectItem>
              <SelectItem value="☁️ 曇り">☁️ 曇り</SelectItem>
              <SelectItem value="🌧️ 雨">🌧️ 雨</SelectItem>
              <SelectItem value="❄️ 雪">❄️ 雪</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="memo">メモ</Label>
          <Input type="text" id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} disabled={isSubmitting} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </form>
    </div>
  )
}

