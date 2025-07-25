"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { getGoogleMapsLoader } from "@/lib/google-maps-loader"
import type { Spot } from "@/types/station"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleMap extends google.maps.Map {
  setCenter(latlng: { lat: number; lng: number }): void
  setZoom(zoom: number): void
  fitBounds(bounds: google.maps.LatLngBounds): void
}

interface Marker extends google.maps.Marker {
  setMap(map: google.maps.Map | null): void
  setAnimation(animation: any): void
}

interface MapProps {
  center: {
    lat: number
    lng: number
  }
  selectedSpot: Spot | null
  stationKey: string
}

export default function Map({ center, selectedSpot }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const directionsRendererRef = useRef<
    (google.maps.DirectionsRenderer & { setMap: (map: google.maps.Map | null) => void }) | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [walkingTime, setWalkingTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<GoogleMap | null>(null)
  // 削除: const [markers, setMarkers] = useState<Marker[]>([])

  const stationMarkerRef = useRef<Marker | null>(null)
  const spotMarkerRef = useRef<Marker | null>(null)

  const memoizedCenter = useMemo(() => ({ lat: center.lat, lng: center.lng }), [center.lat, center.lng])

  useEffect(() => {
    let isMounted = true
    const initMap = async () => {
      if (!mapRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        const loader = await getGoogleMapsLoader()
        await loader.load()

        if (!window.google) {
          throw new Error("Google Maps failed to load")
        }

        const { Map } = window.google.maps

        const mapOptions: google.maps.MapOptions = {
          center: memoizedCenter,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }

        if (isMounted && mapRef.current) {
          const newMap = new window.google.maps.Map(mapRef.current, mapOptions) as GoogleMap
          setMap(newMap)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Google Maps エラー:", error)
        if (isMounted) {
          if (error instanceof Error) {
            setError(`Google Mapsの読み込みに失敗しました: ${error.message}`)
          } else {
            setError("Google Mapsの読み込みに失敗しました。APIキーの設定を確認してください。")
          }
          setIsLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [memoizedCenter])

  useEffect(() => {
    if (!map || !selectedSpot || !window.google) return

    const { Marker, InfoWindow, DirectionsService, DirectionsRenderer, LatLngBounds } = window.google.maps

    // Clear previous directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
    }
    // Clear previous markers
    if (stationMarkerRef.current) {
      stationMarkerRef.current.setMap(null)
    }
    if (spotMarkerRef.current) {
      spotMarkerRef.current.setMap(null)
    }

    // Update map center and zoom
    const newCenter = memoizedCenter
    map.setCenter(newCenter)
    map.setZoom(15)

    // Station marker (red)
    stationMarkerRef.current = new Marker({
      position: center,
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    }) as Marker

    if (selectedSpot) {
      const spotPosition = { lat: selectedSpot.lat, lng: selectedSpot.lng }
      spotMarkerRef.current = new Marker({
        position: spotPosition,
        map,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      }) as Marker

      // アニメーションの設定（もし利用可能なら）
			/*
      if (window.google.maps.Animation && window.google.maps.Animation.DROP) {
        spotMarkerRef.current.setAnimation(window.google.maps.Animation.DROP)
      }
			*/
      const infoWindow = new InfoWindow({
        content: `<div><strong>${selectedSpot.name}</strong><br>${selectedSpot.type}</div>`,
      })

      infoWindow.open(map, spotMarkerRef.current)
    }

    const directionsService = new DirectionsService()
    directionsRendererRef.current = new DirectionsRenderer({
      map,
      suppressMarkers: true,
    }) as google.maps.DirectionsRenderer & { setMap: (map: google.maps.Map | null) => void }

    const request: google.maps.DirectionsRequest = {
      origin: newCenter,
      destination: selectedSpot ? { lat: selectedSpot.lat, lng: selectedSpot.lng } : newCenter,
      travelMode: google.maps.TravelMode.WALKING,
    }

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result)

        const route = result.routes[0]
        if (route && route.legs.length > 0) {
          const duration = route.legs[0].duration
          if (duration) {
            setWalkingTime(duration.text)
          }
        }

        const bounds = new LatLngBounds()
        bounds.extend(newCenter)
        if (selectedSpot) bounds.extend({ lat: selectedSpot.lat, lng: selectedSpot.lng })
        map.fitBounds(bounds)
      } else {
        console.error("Directions request failed due to " + status)
        setError(`ルートの取得に失敗しました: ${status}`)
      }
    })
  }, [map, selectedSpot, memoizedCenter])

  return (
    <div className="space-y-2">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="relative w-full h-[300px]">
            <div ref={mapRef} className="w-full h-full rounded-lg" />
            {isLoading && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground rounded-lg">
                地図を読み込んでいます...
              </div>
            )}
          </div>
          <div className="h-6 flex items-center justify-center">
            {walkingTime ? (
              <p className="text-sm text-muted-foreground">徒歩所要時間: 約{walkingTime}</p>
            ) : (
              <p className="text-sm text-muted-foreground">スポットを選択すると、ルートと所要時間が表示されます。</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

