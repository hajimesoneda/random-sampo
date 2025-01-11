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
      mapId?: string;
    }
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map: Map, anchor?: any): void;
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
      setMap(map: Map | null): void;
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
      WALKING = 'WALKING'
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
      OK = 'OK'
    }
    class LatLngBounds {
      extend(latLng: { lat: number; lng: number }): void;
    }
    namespace marker {
      class AdvancedMarkerElement {
        constructor(opts?: AdvancedMarkerElementOptions);
        addListener(event: string, handler: () => void): void;
      }
      interface AdvancedMarkerElementOptions {
        map: Map;
        position: { lat: number; lng: number };
        title?: string;
        content?: HTMLElement;
      }
    }
  }
}
