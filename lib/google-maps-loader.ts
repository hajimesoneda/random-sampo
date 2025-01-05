/// <reference types="@types/google.maps" />
import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null;

export async function getGoogleMapsLoader(): Promise<Loader> {
  if (loaderInstance) return loaderInstance;

  try {
    const response = await fetch('/api/maps-api-key');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.apiKey) {
      console.error('API key not received from server');
      throw new Error('Failed to load Google Maps API key');
    }

    console.log('Received API key:', data.apiKey.substring(0, 5) + '...');  // APIキーの最初の5文字のみをログ出力

    loaderInstance = new Loader({
      apiKey: data.apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'ja',
      region: 'JP',
    });

    return loaderInstance;
  } catch (error) {
    console.error('Error loading Google Maps API key:', error);
    throw error;
  }
}

export type { Loader }

