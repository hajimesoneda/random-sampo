"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Train, CalendarDays, Cloud } from "lucide-react"
import { getVisitedStations, resetVisitedStations } from "@/app/actions/index"
import type { VisitInfo } from "@/types/station"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function VisitedStations() {
  const router = useRouter()
  const [visits, setVisits] = useState<VisitInfo[]>([])
  const [loading, setLoading] = useState(true)

  const loadVisits = async () => {
    try {
      const visitedStations = await getVisitedStations()
      setVisits(visitedStations)
    } catch (error) {
      console.error("訪問履歴の取得に失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVisits()
  }, [])

  const handleReset = async () => {
    try {
      await resetVisitedStations()
      setVisits([])
    } catch (error) {
      console.error("訪問履歴のリセットに失敗しました:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visits.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">まだ訪問した駅がありません</div>
      ) : (
        <>
          {visits.map((visit, index) => (
            <Card
              key={`${visit.stationId}-${index}`}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/visit/${encodeURIComponent(visit.stationId)}`)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold cursor-pointer hover:underline">{visit.name}駅</div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Train className="w-4 h-4 mr-1" />
                        <span>{visit.lines && visit.lines.length > 0 ? visit.lines.join("、") : "路線情報なし"}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {visit.date === "unknown" ? "日付不明" : visit.date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cloud className="w-4 h-4" />
                    <span>{visit.weather === "unknown" ? "天気不明" : visit.weather}</span>
                  </div>

                  {visit.memo && <div className="text-sm border-t pt-2 mt-2">{visit.memo}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full mt-4">
                訪問情報をリセット
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>訪問情報のリセット</AlertDialogTitle>
                <AlertDialogDescription>
                  すべての訪問情報が削除されます。この操作は取り消せません。本当にリセットしますか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>リセット</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

