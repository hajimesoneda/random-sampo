import { Loader } from '@googlemaps/js-api-loader'

// シングルトンとしてLoaderを作成
export const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places'],
  language: 'ja',
  region: 'JP',
})

