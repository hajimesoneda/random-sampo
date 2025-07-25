declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
    }
    interface MapOptions {
      center: { lat: number; lng: number };
      zoom: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    }
    class Marker {
      constructor(opts?: MarkerOptions);
    }
    interface MarkerOptions {
      position: { lat: number; lng: number };
      map: Map;
      animation?: any;
      icon?: string;
    }
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
    }
    interface InfoWindowOptions {
      content: string;
    }
    class DirectionsService {
      route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
    }
    class DirectionsRenderer {
      constructor(opts?: DirectionsRendererOptions);
      setDirections(result: DirectionsResult): void;
    }
    interface DirectionsRendererOptions {
      map: Map;
      suppressMarkers?: boolean;
    }
    interface DirectionsRequest {
      origin: { lat: number; lng: number } | string;
      destination: { lat: number; lng: number } | string;
      travelMode: TravelMode;
    }
    enum TravelMode {
      WALKING
    }
    interface DirectionsResult {
      routes: Array<{
        legs: Array<{
          duration: {
            text: string;
          };
        }>;
      }>;
    }
    enum DirectionsStatus {
      OK
    }
    class LatLngBounds {
      extend(latLng: { lat: number; lng: number }): void;
    }
  }
}

