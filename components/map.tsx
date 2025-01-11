import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { Spot } from '@/types/station';
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'

interface MapProps {
  center: {
    lat: number;
    lng: number;
  };
  selectedSpot: Spot | null;
  spots?: Spot[];
}

export default function Map({ center, selectedSpot, spots = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const stationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const spotMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const createMarkerElement = useCallback((color: string): HTMLElement => {
    const div = document.createElement('div');
    div.style.width = '16px';
    div.style.height = '16px';
    div.style.borderRadius = '50%';
    div.style.backgroundColor = color;
    div.style.border = '2px solid white';
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    return div;
  }, []);

  const clearMap = useCallback(() => {
    if (stationMarkerRef.current) {
      stationMarkerRef.current.map = null;
      stationMarkerRef.current = null;
    }
    spotMarkersRef.current.forEach(marker => {
      if (marker) marker.map = null;
    });
    spotMarkersRef.current = [];
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, []);

  const createSpotMarkers = useCallback((map: google.maps.Map, spots: Spot[]) => {
    spotMarkersRef.current = spots.map(spot => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: spot.lat, lng: spot.lng },
        title: spot.name,
        content: createMarkerElement('blue')
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${spot.name}</strong><br>${spot.type}</div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });
  }, [createMarkerElement]);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await loadGoogleMaps();

      const mapOptions: google.maps.MapOptions = {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
      };

      clearMap();

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      stationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: center,
        title: '駅',
        content: createMarkerElement('red')
      });

      // Create markers for all spots
      createSpotMarkers(mapInstanceRef.current, spots);

      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true
      });

      // Fit bounds to include all markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      spots.forEach(spot => {
        bounds.extend({ lat: spot.lat, lng: spot.lng });
      });
      mapInstanceRef.current.fitBounds(bounds);

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('地図の読み込みに失敗しました。');
      setIsLoading(false);
    }
  }, [center, clearMap, createMarkerElement, createSpotMarkers, spots]);

  const updateRoute = useCallback(async (spot: Spot) => {
    if (!mapInstanceRef.current) return;

    try {
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true
        });
      } else {
        directionsRendererRef.current.setMap(mapInstanceRef.current);
      }

      const directionsService = new google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: center,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: google.maps.TravelMode.WALKING
      };

      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`経路の取得に失敗しました: ${status}`));
          }
        });
      });

      directionsRendererRef.current.setDirections(result);

      // Fit bounds to include the route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(center);
      bounds.extend({ lat: spot.lat, lng: spot.lng });
      result.routes[0].overview_path.forEach(point => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);

    } catch (err) {
      console.error('Error updating route:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    }
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      clearMap();
    };
  }, [initMap, clearMap]);

  useEffect(() => {
    if (selectedSpot) {
      updateRoute(selectedSpot);
    } else if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
  }, [selectedSpot, updateRoute]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    initMap();
  };

  return (
    <div className="space-y-2">
      {error ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            再読み込み
          </Button>
        </div>
      ) : (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-[300px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground"
          >
            {isLoading && "地図を読み込んでいます..."}
          </div>
        </>
      )}
    </div>
  );
}

