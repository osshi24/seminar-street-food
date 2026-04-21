'use client';

import { useEffect, useRef } from 'react';

interface BoundaryCoord {
  lat: number;
  lng: number;
}

interface OtherPinMark {
  lat: number;
  lng: number;
  storeName: string;
}

interface MiniMapProps {
  lat: number;
  lng: number;
  boundary?: BoundaryCoord[];
  otherPins?: OtherPinMark[];
  approvedPin?: { lat: number; lng: number };
}

export default function MiniMap({ lat, lng, boundary, otherPins, approvedPin }: MiniMapProps) {
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
      interactive: true,
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

    if (otherPins && otherPins.length > 0) {
      for (const p of otherPins) {
        const nearEl = document.createElement('div');
        nearEl.style.cssText = `
          width: 18px; height: 18px;
          background: #3b82f6; border: 2.5px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        `;
        const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
          .setText(p.storeName);
        new maplibregl.Marker({ element: nearEl, anchor: 'bottom' })
          .setLngLat([p.lng, p.lat])
          .setPopup(popup)
          .addTo(map);
      }
    }

    if (approvedPin) {
      const approvedEl = document.createElement('div');
      approvedEl.style.cssText = `
        width: 20px; height: 20px;
        background: #10b981; border: 2.5px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      `;
      const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
        .setText('Ghim đã duyệt hiện tại');
      new maplibregl.Marker({ element: approvedEl, anchor: 'bottom' })
        .setLngLat([approvedPin.lng, approvedPin.lat])
        .setPopup(popup)
        .addTo(map);
    }

    if (boundary && boundary.length >= 3) {
      const ring = boundary.map((c) => [c.lng, c.lat] as [number, number]);
      // GeoJSON polygon rings must be closed
      if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
        ring.push(ring[0]);
      }
      map.on('load', () => {
        map.addSource('boundary', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} },
        });
        map.addLayer({ id: 'boundary-fill', type: 'fill', source: 'boundary', paint: { 'fill-color': '#f97316', 'fill-opacity': 0.08 } });
        map.addLayer({ id: 'boundary-line', type: 'line', source: 'boundary', paint: { 'line-color': '#f97316', 'line-width': 2 } });
      });
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
      style={{ height: '100%', minHeight: '480px', width: '100%', zIndex: 0 }}
    />
  );
}
