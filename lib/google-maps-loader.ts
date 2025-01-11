import { Loader } from '@googlemaps/js-api-loader'

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loader: Loader | null = null;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (!this.loader) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

      if (!apiKey) {
        throw new Error('Google Maps API key is not configured');
      }

      this.loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'marker'],
        language: 'ja',
        region: 'JP',
        mapIds: mapId ? [mapId] : undefined
      });
    }

    this.loadPromise = this.loader.load().catch((error) => {
      this.loadPromise = null;
      throw error;
    });

    return this.loadPromise;
  }
}

export const loadGoogleMaps = () => GoogleMapsLoader.getInstance().load();

