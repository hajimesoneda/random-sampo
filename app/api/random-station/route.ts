import { NextResponse } from 'next/server'
import { Station, Spot } from '@/types/station'
import stationsData from '@/data/tokyo-stations.json'

interface PlaceResult {
  place_id: string;
  name: string;
  photos?: { photo_reference: string }[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  price_level?: number;
}

export async function GET() {
  try {
    // Validate stations data
    if (!Array.isArray(stationsData) || stationsData.length === 0) {
      console.error('Invalid stations data:', stationsData);
      return NextResponse.json({ error: '駅データが見つかりません' }, { status: 404 });
    }

    // Select random station
    const randomStationData = stationsData[Math.floor(Math.random() * stationsData.length)];
    
    // Validate station data
    if (!randomStationData || !randomStationData.id || !randomStationData.name || 
        !randomStationData.lines || !Array.isArray(randomStationData.lines) ||
        typeof randomStationData.lat !== 'number' || typeof randomStationData.lng !== 'number') {
      console.error('Invalid station data:', randomStationData);
      return NextResponse.json({ error: '無効な駅データです' }, { status: 500 });
    }

    const randomStation: Station = {
      ...randomStationData,
      spots: [],
      passengers: randomStationData.passengers ?? null,
      firstDeparture: randomStationData.firstDeparture ?? null
    };

    // Validate Google Maps API Key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not configured');
      return NextResponse.json({ error: 'サーバーの設定が不適切です' }, { status: 500 });
    }

    // Fetch nearby places
    const types = ['tourist_attraction', 'cafe', 'restaurant'];
    const spotPromises = types.map(type => getNearbyPlaces(randomStation.lat, randomStation.lng, type, apiKey));
    const spotsArrays = await Promise.all(spotPromises);
    
    // Combine and filter spots
    const allSpots = spotsArrays.flat();
    const uniqueSpots = Array.from(new Map(allSpots.map(spot => [spot.id, spot])).values());
    randomStation.spots = uniqueSpots.slice(0, 4);

    return NextResponse.json(randomStation);
  } catch (error) {
    console.error('Random station error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ランダム駅の取得に失敗しました' },
      { status: 500 }
    );
  }
}

async function getNearbyPlaces(lat: number, lng: number, type: string, apiKey: string): Promise<Spot[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=${type}&language=ja&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.results) {
      console.warn(`No ${type} spots found near ${lat},${lng}`);
      return [];
    }

    return data.results.slice(0, 2).map((place: PlaceResult) => ({
      id: place.place_id,
      name: place.name,
      type: type as "tourist_attraction" | "cafe" | "restaurant" | "public_bath",
      photo: place.photos?.[0] 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
        : null,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    }));
  } catch (error) {
    console.error(`Error fetching ${type} places:`, error);
    return [];
  }
}

