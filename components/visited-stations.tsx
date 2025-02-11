import { Card, CardContent } from "@/components/ui/card"
import { Train } from "lucide-react"
import type { VisitInfo } from "@/types/station"

interface VisitedStationsProps {
  visitedStations: VisitInfo[]
}

export function VisitedStations({ visitedStations }: VisitedStationsProps) {
  return (
    <div className="space-y-4">
      {visitedStations.length === 0 ? (
        <p className="text-center text-muted-foreground">訪問した駅はありません</p>
      ) : (
        visitedStations.map((visit) => (
          <Card key={`${visit.stationId}-${visit.date}`}>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">{visit.name}駅</h3>
              <p className="text-sm text-muted-foreground">
                <Train className="inline-block mr-1" size={16} />
                訪問日: {visit.date}
              </p>
              <p className="text-sm">天気: {visit.weather}</p>
              {visit.memo && <p className="text-sm mt-2">メモ: {visit.memo}</p>}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

