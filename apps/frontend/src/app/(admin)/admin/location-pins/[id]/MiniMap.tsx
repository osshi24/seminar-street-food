'use client';

import { useEffect, useRef } from 'react';
import { initLeafletIcons } from '../../../../../lib/map/leaflet-config';

interface MiniMapProps {
  lat: number;
  lng: number;
}

export default function MiniMap({ lat, lng }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(mapRef.current, { zoomControl: false, dragging: false }).setView([lat, lng], 17);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.marker([lat, lng]).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: '200px', width: '100%', borderRadius: '8px', zIndex: 0 }}
    />
  );
}
