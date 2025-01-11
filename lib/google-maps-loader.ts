import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null;
let apiKeyPromise: Promise<string> | null = null;

async function getApiKey(): Promise<string> {
  if (!apiKeyPromise) {
    apiKeyPromise = fetch('/api/maps-api-key')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data.apiKey) {
          throw new Error('API key not received from server');
        }
        return data.apiKey;
      });
  }
  return apiKeyPromise;
}

export async function getGoogleMapsLoader(): Promise<Loader> {
  if (loaderInstance) return loaderInstance;

  try {
    const apiKey = await getApiKey();
    
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
      language: 'ja',
      region: 'JP'
    });

    return loaderInstance;
  } catch (error) {
    console.error('Error loading Google Maps API key:', error);
    throw error;
  }
}

export type { Loader }

