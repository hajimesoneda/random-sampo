'use server'

import { cache } from 'react'

interface PlacePhoto {
  url: string
  attribution: string
}

interface PlaceInfo {
  name: string
  photos: PlacePhoto[]
}

export const getPlaceInfo = cache(async (query: string): Promise<PlaceInfo> => {
  try {
    // Google Places APIのテキスト検索を使用
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      `${query} 東京`
    )}&key=${process.env.GOOGLE_PLACES_API_KEY}&language=ja`

    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`Places API Search error: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()
    if (!searchData.results?.[0]) {
      console.warn('No places found for query:', query)
      return { name: query, photos: [] }
    }

    const place = searchData.results[0]

    // 写真のURLを生成（最大3枚）
    const photos = (place.photos || []).slice(0, 3).map((photo: { photo_reference: string, html_attributions?: string[] }) => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
        photo.photo_reference
      }&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      attribution: photo.html_attributions?.[0] || ''
    }))

    return {
      name: place.name,
      photos: photos
    }
  } catch (error) {
    console.error('Error fetching place info:', error)
    return { name: query, photos: [] }
  }
})

