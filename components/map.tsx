'use client'

import { useEffect, useRef, useState } from 'react'
import { loader } from '@/lib/google-maps-loader'
import { Spot } from '@/types/station'

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

  useEffect(() => {
    const initMap = async () => {
      try {
        const google = await loader.load()
        if (mapRef.current) {
          const mapOptions = {
            center,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }

          const map = new google.maps.Map(mapRef.current, mapOptions)

          // Station marker (red)
          const stationMarker = new google.maps.Marker({
            position: center,
            map,
            animation: google.maps.Animation.DROP,
            icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          })

          if (selectedSpot) {
            const spotPosition = { lat: selectedSpot.lat, lng: selectedSpot.lng }
            const spotMarker = new google.maps.Marker({
              position: spotPosition,
              map,
              animation: google.maps.Animation.DROP,
              icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            })

            const infoWindow = new google.maps.InfoWindow({
              content: `<div><strong>${selectedSpot.name}</strong><br>${selectedSpot.type}</div>`
            })

            infoWindow.open(map, spotMarker)

            // Draw route between station and selected spot
            const directionsService = new google.maps.DirectionsService()
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true, // Don't show default markers
            })

            const request = {
              origin: center,
              destination: spotPosition,
              travelMode: google.maps.TravelMode.WALKING
            }

            directionsService.route(request, (result, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result)

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

  if (error) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <p className="text-red-500 text-center p-4">{error}</p>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
    >
      地図を読み込んでいます...
    </div>
  )
}

