'use client';

import { useEffect, useRef, useCallback } from 'react';
import { initLeafletIcons } from '../../../../../lib/map/leaflet-config';

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
    if (mapInstanceRef.current) return; // Already initialized

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Draggable marker
    const markerLatLng = initialMarker
      ? L.latLng(initialMarker.lat, initialMarker.lng)
      : L.latLng(center.lat, center.lng);

    const marker = L.marker(markerLatLng, { draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleCoordChange(pos.lat, pos.lng);
    });

    // Click to move marker
    map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handleCoordChange(e.latlng.lat, e.latlng.lng);
    });

    // Draw boundary polygon if provided
    if (boundary && boundary.length >= 3) {
      L.polygon(
        boundary.map((c) => [c.lat, c.lng] as [number, number]),
        { color: '#f97316', fillOpacity: 0.1, weight: 2 },
      ).addTo(map);
    }

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
