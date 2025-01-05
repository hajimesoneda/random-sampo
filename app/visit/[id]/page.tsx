'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { saveVisit, getVisitedStations } from '@/app/actions'
import { Calendar } from "@/components/ui/calendar"
import { ja } from 'date-fns/locale';
import { VisitInfo } from '@/types/station'

const weatherOptions = [
  { value: "unknown", label: "不明" },
  { value: "☀️ 晴れ", label: "☀️ 晴れ" },
  { value: "☁️ 曇り", label: "☁️ 曇り" },
  { value: "🌧️ 雨", label: "🌧️ 雨" },
  { value: "❄️ 雪", label: "❄️ 雪" },
] as const

export default function VisitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [date, setDate] = useState<string>("unknown")
  const [weather, setWeather] = useState<typeof weatherOptions[number]['value']>("unknown")
  const [memo, setMemo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [stationName, setStationName] = useState('')
  const [stationLines, setStationLines] = useState<string[]>([])

  useEffect(() => {
    const loadExistingVisit = async () => {
      const visits = await getVisitedStations()
      const existingVisit = visits.find(v => v.stationId === params.id)
      if (existingVisit) {
        setDate(existingVisit.date)
        setWeather(existingVisit.weather)
        setMemo(existingVisit.memo)
        setStationName(existingVisit.name)
        setStationLines(existingVisit.lines)
      } else {
        // 新規訪問の場合、駅情報を取得
        const decodedId = decodeURIComponent(params.id)
        const response = await fetch(`/api/station/${encodeURIComponent(decodedId)}`)
        if (response.ok) {
          const stationData = await response.json()
          setStationName(stationData.name)
          setStationLines(stationData.lines)
        }
      }
    }
    loadExistingVisit()
  }, [params.id])

  const handleSubmit = async () => {
    await saveVisit({
      stationId: decodeURIComponent(params.id),
      name: stationName,
      lines: stationLines,
      date,
      weather,
      memo
    })
    router.push('/')
  }

  const getMaxDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <main className="container max-w-md mx-auto p-4">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        戻る
      </Button>

      <h1 className="text-2xl font-bold mb-4">
        {stationName}駅に行ってみた！
      </h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">訪問日</label>
            <div className="relative">
              <Input
                type="text"
                value={date === "unknown" ? "不明" : date}
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
                  selected={date === "unknown" ? undefined : new Date(date)}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate.toISOString().split('T')[0])
                    } else {
                      setDate("unknown")
                    }
                    setShowDatePicker(false)
                  }}
                  initialFocus
                  locale={ja}
                  disabled={{ after: new Date() }}
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
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weatherOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

