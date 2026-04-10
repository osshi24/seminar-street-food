'use client';

import { useEffect, useMemo, useRef } from 'react';
import { initLeafletIcons } from '../../../../lib/map/leaflet-config';
import type { Boundary } from '../../../../lib/api/admin-location';

const COLORS = ['#2563eb', '#ea580c', '#16a34a', '#9333ea', '#dc2626', '#0891b2', '#c026d3'];

const PALETTE = (i: number) => COLORS[i % COLORS.length];

export default function BoundariesOverviewMap({
  boundaries,
  height = 480,
}: {
  boundaries: Boundary[];
  height?: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupRef = useRef<any>(null);

  const center = useMemo(() => {
    const first = boundaries.find((b) => (b.polygonCoordinates?.length ?? 0) >= 3);
    if (!first?.polygonCoordinates?.length) return { lat: 10.762622, lng: 106.660172 };
    const c = first.polygonCoordinates[0];
    return { lat: c.lat, lng: c.lng };
  }, [boundaries]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    groupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !groupRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = mapInstanceRef.current;
    groupRef.current.clearLayers();

    const bounds: [number, number][] = [];

    boundaries.forEach((b, i) => {
      const coords = b.polygonCoordinates ?? [];
      if (coords.length < 3) return;
      const color = PALETTE(i);
      const latlngs = coords.map((c) => [c.lat, c.lng] as [number, number]);
      latlngs.forEach((ll) => bounds.push(ll));

      L.polygon(latlngs, {
        color,
        weight: 2,
        fillOpacity: 0.12,
      })
        .bindTooltip(`${b.name}${b.isActive ? '' : ' (tắt)'}`, { sticky: true })
        .addTo(groupRef.current);

      coords.forEach((c) => {
        L.circleMarker([c.lat, c.lng], { radius: 4, color, fillColor: color, fillOpacity: 0.9, weight: 1 }).addTo(
          groupRef.current,
        );
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [24, 24], maxZoom: 17 });
    }
  }, [boundaries]);

  return (
    <div
      ref={mapRef}
      style={{ height: `${height}px`, width: '100%', borderRadius: '8px', zIndex: 0 }}
    />
  );
}
