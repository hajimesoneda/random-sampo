"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { saveVisit, getVisitedStations } from "@/app/actions/index"
import { Calendar } from "@/components/ui/calendar"
import { ja } from "date-fns/locale"
import { format } from "date-fns"

type WeatherOption = "unknown" | "☀️ 晴れ" | "☁️ 曇り" | "🌧️ 雨" | "❄️ 雪"

const weatherOptions: WeatherOption[] = ["unknown", "☀️ 晴れ", "☁️ 曇り", "🌧️ 雨", "❄️ 雪"]

export default function VisitPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const [date, setDate] = useState<Date | "unknown">(new Date())
  const [weather, setWeather] = useState<WeatherOption>("unknown")
  const [memo, setMemo] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [stationName, setStationName] = useState("")
  const [stationLines, setStationLines] = useState<string[]>([])

  useEffect(() => {
    const loadExistingVisit = async () => {
      console.log("Loading visit data for station ID:", id)
      const visits = await getVisitedStations()
      console.log("All visits:", visits)
      const existingVisit = visits.find((v) => v.stationId === decodeURIComponent(id))
      console.log("Existing visit:", existingVisit)

      if (existingVisit) {
        console.log("Setting existing visit data")
        setDate(existingVisit.date === "unknown" ? "unknown" : new Date(existingVisit.date))
        setWeather(existingVisit.weather as WeatherOption)
        setMemo(existingVisit.memo)
        setStationName(existingVisit.name)
        setStationLines(existingVisit.lines)
      } else {
        console.log("No existing visit found, fetching station data")
        const decodedId = decodeURIComponent(id)
        const response = await fetch(`/api/station/${encodeURIComponent(decodedId)}`)
        if (response.ok) {
          const stationData = await response.json()
          console.log("Fetched station data:", stationData)
          setStationName(stationData.name)
          setStationLines(stationData.lines)
          setDate(new Date())
          setWeather("unknown")
          setMemo("")
        } else {
          console.error("Failed to fetch station data")
        }
      }
    }

    loadExistingVisit()
  }, [id])

  const handleSubmit = async () => {
    const visitInfo = {
      stationId: decodeURIComponent(id),
      name: stationName,
      lines: stationLines,
      date: date === "unknown" ? "unknown" : format(date, "yyyy-MM-dd"),
      weather,
      memo,
    }
    console.log("Saving visit info:", visitInfo)
    await saveVisit(visitInfo)
    router.push("/?tab=visited")
  }

  const formatDisplayDate = (date: Date | "unknown") => {
    if (date === "unknown") return "不明"
    return format(date, "yyyy年MM月dd日")
  }

  return (
    <main className="container max-w-md mx-auto p-4">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        戻る
      </Button>

      <h1 className="text-2xl font-bold mb-4">{stationName}駅に行ってみた！</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">訪問日</label>
            <div className="relative">
              <Input
                type="text"
                value={formatDisplayDate(date)}
                readOnly
                className="w-full cursor-pointer"
                onClick={() => setShowDatePicker(true)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            {showDatePicker && (
              <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md">
                <Calendar
                  mode="single"
                  selected={date === "unknown" ? undefined : date}
                  onSelect={(newDate) => {
                    setDate(newDate || "unknown")
                    setShowDatePicker(false)
                  }}
                  initialFocus
                  locale={ja}
                  disabled={{ after: new Date() }}
                  className="rounded-md border"
                />
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setDate("unknown")
                      setShowDatePicker(false)
                    }}
                  >
                    不明
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">天気</label>
            <Select value={weather} onValueChange={(value: WeatherOption) => setWeather(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weatherOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "unknown" ? "不明" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">📝 メモ</label>
            <Textarea
              placeholder="メモを入力してください"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            訪問済み情報を保存
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

