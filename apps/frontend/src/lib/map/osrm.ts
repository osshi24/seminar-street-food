const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface RouteResult {
  /** Decoded polyline as [lat, lng][] */
  coordinates: [number, number][];
  /** Distance in meters */
  distanceMeters: number;
  /** Duration in seconds */
  durationSeconds: number;
}

export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RouteResult> {
  // OSRM expects lng,lat (not lat,lng)
  const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM request failed');

  const data = await res.json() as {
    code: string;
    routes: Array<{
      distance: number;
      duration: number;
      geometry: { type: string; coordinates: [number, number][] };
    }>;
  };

  if (data.code !== 'Ok' || !data.routes.length) {
    throw new Error('No route found');
  }

  const route = data.routes[0];

  return {
    // GeoJSON is [lng, lat] → flip to [lat, lng] for Leaflet
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `< 1 phút`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem} phút` : `${hrs}h`;
}
