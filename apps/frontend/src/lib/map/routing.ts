// OSRM routing helpers — SSR-safe (no window usage)

export function buildOSRMRouteUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  // Using the public OSRM demo server — for production use a self-hosted instance
  return `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
}

interface OSRMResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
  }>;
}

export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

export function parseOSRMResponse(data: OSRMResponse): RouteResult | null {
  const route = data?.routes?.[0];
  if (!route) return null;
  return {
    coordinates: route.geometry.coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
