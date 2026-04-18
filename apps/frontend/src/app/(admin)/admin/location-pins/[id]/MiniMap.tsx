'use client';

import { useEffect, useRef } from 'react';

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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [lng, lat],
      zoom: 17,
      interactive: false,
    });
    mapInstanceRef.current = map;

    const el = document.createElement('div');
    el.style.cssText = `
      width: 24px; height: 24px;
      background: #f97316; border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    `;

    new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([lng, lat])
      .addTo(map);

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
