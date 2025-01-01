'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Train, CalendarDays, Cloud } from 'lucide-react'
import { getVisitedStations } from '@/app/actions'
import { VisitInfo } from '@/types/station'

export function VisitedStations() {
  const [visits, setVisits] = useState<VisitInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVisits = async () => {
      try {
        const visitedStations = await getVisitedStations()
        setVisits(visitedStations)
      } catch (error) {
        console.error('訪問履歴の取得に失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    loadVisits()
  }, [])

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

  if (visits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        まだ訪問した駅がありません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {visits.map((visit, index) => (
        <Card key={`${visit.stationId}-${index}`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4" />
                <h3 className="font-semibold">{decodeURIComponent(visit.stationId)}駅</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>{visit.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  <span>{visit.weather}</span>
                </div>
              </div>

              {visit.memo && (
                <div className="text-sm border-t pt-2 mt-2">
                  {visit.memo}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

