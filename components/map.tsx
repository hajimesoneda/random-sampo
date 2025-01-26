"use client"

import { useEffect, useRef, useState } from "react"
import { getGoogleMapsLoader } from "@/lib/google-maps-loader"
import type { Spot } from "@/types/station"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MapProps {
  center: {
    lat: number
    lng: number
  }
  selectedSpot: Spot | null
  stationKey: string
}

export default function Map({ center, selectedSpot, stationKey }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [walkingTime, setWalkingTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [map, setMap] = useState<google.maps.Map | null>(null)

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
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }

        if (isMounted && mapRef.current) {
          const newMap = new Map(mapRef.current, mapOptions)
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
  }, [center])

  useEffect(() => {
    if (!map || !selectedSpot) return

    const { Marker, InfoWindow, DirectionsService, DirectionsRenderer, LatLngBounds } = window.google.maps

    // Clear previous markers and directions
    map.setCenter(center)
    map.setZoom(15)

    // Station marker (red)
    new Marker({
      position: center,
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    })

    const spotPosition = { lat: selectedSpot.lat, lng: selectedSpot.lng }
    const spotMarker = new Marker({
      position: spotPosition,
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    })

    // Set animation if available
    const mapsWithAnimation = window.google.maps as { Animation?: { DROP: any } }
    if (mapsWithAnimation.Animation && "DROP" in mapsWithAnimation.Animation && spotMarker.setAnimation) {
      spotMarker.setAnimation(mapsWithAnimation.Animation.DROP)
    }

    const infoWindow = new InfoWindow({
      content: `<div><strong>${selectedSpot.name}</strong><br>${selectedSpot.type}</div>`,
    })

    infoWindow.open(map, spotMarker)

    const directionsService = new DirectionsService()
    const directionsRenderer = new DirectionsRenderer({
      map,
      suppressMarkers: true,
    })

    const request: google.maps.DirectionsRequest = {
      origin: center,
      destination: spotPosition,
      travelMode: google.maps.TravelMode.WALKING,
    }

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result)

        const route = result.routes[0]
        if (route && route.legs.length > 0) {
          const duration = route.legs[0].duration
          if (duration) {
            setWalkingTime(duration.text)
          }
        }

        const bounds = new LatLngBounds()
        bounds.extend(center)
        bounds.extend(spotPosition)
        map.fitBounds(bounds)
      } else {
        console.error("Directions request failed due to " + status)
        setError(`ルートの取得に失敗しました: ${status}`)
      }
    })
  }, [map, selectedSpot, center])

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

