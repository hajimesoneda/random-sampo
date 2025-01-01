'use client'

import { useState } from 'react'
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
import { ArrowLeft } from 'lucide-react'
import { saveVisit } from '@/app/actions'

const weatherOptions = [
  { value: "☀️ 晴れ", label: "☀️ 晴れ" },
  { value: "☁️ 曇り", label: "☁️ 曇り" },
  { value: "🌧️ 雨", label: "🌧️ 雨" },
  { value: "❄️ 雪", label: "❄️ 雪" },
] as const

export default function VisitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weather, setWeather] = useState<typeof weatherOptions[number]['value']>("☀️ 晴れ")
  const [memo, setMemo] = useState('')

  const handleSubmit = async () => {
    await saveVisit({
      stationId: decodeURIComponent(params.id),
      date,
      weather,
      memo
    })
    router.push('/')
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
        {decodeURIComponent(params.id)}駅に行ってみた！
      </h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">訪問日</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">天気</label>
            <Select value={weather} onValueChange={setWeather}>
              <SelectTrigger>
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

