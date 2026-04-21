'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Coordinate {
  lat: number;
  lng: number;
}

interface LocationMapPickerProps {
  center?: Coordinate;
  initialMarker?: Coordinate | null;
  boundary?: Coordinate[] | null;
  onCoordinateChange: (lat: number, lng: number) => void;
}

export default function LocationMapPicker({
  center = { lat: 10.762622, lng: 106.660172 },
  initialMarker,
  boundary,
  onCoordinateChange,
}: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const handleCoordChange = useCallback(onCoordinateChange, [onCoordinateChange]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');

    const markerPos = initialMarker ?? center;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [markerPos.lng, markerPos.lat],
      zoom: 16,
    });
    mapInstanceRef.current = map;

    // Draggable marker using a custom element
    const el = document.createElement('div');
    el.style.cssText = `
      width: 28px; height: 28px;
      background: #f97316; border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      cursor: grab;
    `;

    const marker = new maplibregl.Marker({ element: el, draggable: true, anchor: 'bottom' })
      .setLngLat([markerPos.lng, markerPos.lat])
      .addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      handleCoordChange(lat, lng);
    });

    map.on('click', (e: { lngLat: { lat: number; lng: number } }) => {
      marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
      handleCoordChange(e.lngLat.lat, e.lngLat.lng);
    });

    map.once('load', () => {
      if (boundary && boundary.length >= 3) {
        map.addSource('boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [...boundary.map((c) => [c.lng, c.lat]), [boundary[0].lng, boundary[0].lat]],
              ],
            },
            properties: {},
          },
        });
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: { 'fill-color': '#f97316', 'fill-opacity': 0.1 },
        });
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: { 'line-color': '#f97316', 'line-width': 2 },
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: '360px', width: '100%', borderRadius: '8px', zIndex: 0 }}
    />
  );
}
