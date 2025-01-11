'use client'

import { useEffect, useRef, useState } from 'react'
import { getGoogleMapsLoader } from '@/lib/google-maps-loader'
import { Spot } from '@/types/station'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  center: {
    lat: number
    lng: number
  }
  selectedSpot: Spot | null
}

export default function Map({ center, selectedSpot }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [walkingTime, setWalkingTime] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = await getGoogleMapsLoader()
        await loader.load()
        
        if (!window.google) {
          throw new Error('Google Maps failed to load')
        }

        const { maps } = window.google

        if (mapRef.current) {
          const mapOptions: google.maps.MapOptions = {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }

          const map = new maps.Map(mapRef.current, mapOptions)

          // Station marker (red)
          new maps.Marker({
            position: center,
            map,
            animation: google.maps.Animation.DROP,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          })

          if (selectedSpot) {
            const spotPosition = { lat: selectedSpot.lat, lng: selectedSpot.lng }
            const spotMarker = new maps.Marker({
              position: spotPosition,
              map,
              animation: google.maps.Animation.DROP,
              icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            })

            let infoContent = `<div><strong>${selectedSpot.name}</strong><br>${selectedSpot.type}</div>`

            const infoWindow = new maps.InfoWindow({
              content: infoContent
            })

            infoWindow.open(map, spotMarker)

            // Draw route between station and selected spot
            const directionsService = new maps.DirectionsService()
            const directionsRenderer = new maps.DirectionsRenderer({
              map,
              suppressMarkers: true, // Don't show default markers
            })

            const request: google.maps.DirectionsRequest = {
              origin: center,
              destination: spotPosition,
              travelMode: google.maps.TravelMode.WALKING
            }

            directionsService.route(request, (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRenderer.setDirections(result)

                // Get walking time
                const route = result.routes[0]
                if (route && route.legs.length > 0) {
                  const duration = route.legs[0].duration
                  if (duration) {
                    setWalkingTime(duration.text)
                  }
                }

                // Adjust map bounds to show the entire route
                const bounds = new google.maps.LatLngBounds()
                bounds.extend(center)
                bounds.extend(spotPosition)
                map.fitBounds(bounds)
              } else {
                console.error('Directions request failed due to ' + status)
                setError(`ルートの取得に失敗しました: ${status}`)
              }
            })
          } else {
            setWalkingTime(null)
          }
        }
      } catch (error) {
        console.error('Google Maps エラー:', error)
        if (error instanceof Error) {
          setError(`Google Mapsの読み込みに失敗しました: ${error.message}`)
        } else {
          setError('Google Mapsの読み込みに失敗しました。APIキーの設定を確認してください。')
        }
      }
    }

    initMap()
  }, [center, selectedSpot])

  return (
    <div className="space-y-2">
      <div 
        ref={mapRef} 
        className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
      >
        地図を読み込んでいます...
      </div>
      {error && (
        <p className="text-red-500 text-center p-4">{error}</p>
      )}
      <div className="h-6 flex items-center justify-center">
        {walkingTime ? (
          <p className="text-sm text-muted-foreground">
            徒歩所要時間: 約{walkingTime}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            スポットを選択すると、ルートと所要時間が表示されます。
          </p>
        )}
      </div>
    </div>
  )
}

