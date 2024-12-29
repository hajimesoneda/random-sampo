'use client'

import { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  center: {
    lat: number
    lng: number
  }
}

export default function Map({ center }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
      language: 'ja',
      region: 'JP'
    })

    loader
      .load()
      .then(() => {
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
      })
      .catch((error) => {
        console.error('Google Maps エラー:', error)
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div class="p-4 text-center">
              <p class="text-red-500">Google Mapsの読み込みに失敗しました</p>
              <p class="text-sm text-muted-foreground">エラー: ${error.message}</p>
            </div>
          `
        }
      })
  }, [center])

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
    />
  )
}

