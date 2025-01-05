'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  center: {
    lat: number
    lng: number
  }
}

export default function Map({ center }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places'],
          language: 'ja',
          region: 'JP',
        })

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

          new google.maps.Marker({
            position: center,
            map,
            animation: google.maps.Animation.DROP
          })
        }
      } catch (error) {
        console.error('Google Maps エラー:', error)
        setError('Google Mapsの読み込みに失敗しました。APIキーの設定を確認してください。')
      }
    }

    initMap()
  }, [center])

  if (error) {
    return (
      <div className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        <p className="text-red-500">{error}</p>
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

