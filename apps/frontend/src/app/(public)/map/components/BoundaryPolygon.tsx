'use client';

// Boundary polygon — rendered imperatively via Leaflet, not react-leaflet
// This component is only used inside MapView which handles the Leaflet instance directly.
// Exported as a helper for reference; actual rendering is done in MapView.tsx

export interface BoundaryCoord {
  lat: number;
  lng: number;
}

export function drawBoundaryPolygon(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  coordinates: BoundaryCoord[],
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (typeof window === 'undefined' || coordinates.length < 3) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as typeof import('leaflet');
  return L.polygon(
    coordinates.map((c) => [c.lat, c.lng] as [number, number]),
    { color: '#f97316', weight: 2, fillOpacity: 0.08 },
  ).addTo(map);
}
