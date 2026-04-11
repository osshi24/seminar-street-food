'use client';

import { useEffect, useMemo, useRef } from 'react';
import { initLeafletIcons } from '../../../../lib/map/leaflet-config';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BackgroundBoundary {
  id: string;
  name: string;
  coordinates: Coordinate[];
}

interface Props {
  value: Coordinate[];
  onChange?: (next: Coordinate[]) => void;
  height?: number;
  /** Chỉ hiển thị, không kéo / không click */
  readOnly?: boolean;
  /** Cho phép click map để thêm điểm (mặc định true nếu không readOnly) */
  clickToAdd?: boolean;
  /** Giới hạn số điểm tối đa (vd: tạo mới = 4) */
  maxPoints?: number;
  /** Ranh giới khác vẽ nền (màu xám) để tránh trùng khi tạo mới */
  backgroundBoundaries?: BackgroundBoundary[];
}

export default function BoundaryMapEditor({
  value,
  onChange,
  height = 420,
  readOnly = false,
  clickToAdd,
  maxPoints,
  backgroundBoundaries = [],
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bgLayerRef = useRef<any>(null);

  const allowClickAdd = readOnly
    ? false
    : typeof clickToAdd === 'boolean'
      ? clickToAdd
      : maxPoints === undefined || value.length < maxPoints;

  const valueRef = useRef(value);
  valueRef.current = value;

  const center = useMemo(() => {
    if (value && value.length > 0) {
      const avg = value.reduce(
        (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
        { lat: 0, lng: 0 },
      );
      return { lat: avg.lat / value.length, lng: avg.lng / value.length };
    }
    const bg = backgroundBoundaries.find((b) => b.coordinates.length >= 1);
    if (bg) return { lat: bg.coordinates[0].lat, lng: bg.coordinates[0].lng };
    return { lat: 10.762622, lng: 106.660172 };
  }, [value, backgroundBoundaries]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(mapRef.current).setView([center.lat, center.lng], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    bgLayerRef.current = L.layerGroup().addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    if (!readOnly && allowClickAdd && onChange) {
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        const prev = valueRef.current;
        const next = [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }];
        if (maxPoints !== undefined && next.length > maxPoints) return;
        onChange(next);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !bgLayerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    bgLayerRef.current.clearLayers();
    backgroundBoundaries.forEach((b) => {
      if (b.coordinates.length < 3) return;
      L.polygon(
        b.coordinates.map((c) => [c.lat, c.lng] as [number, number]),
        { color: '#94a3b8', weight: 2, fillOpacity: 0.06, dashArray: '6 4' },
      )
        .bindTooltip(b.name, { sticky: true })
        .addTo(bgLayerRef.current);
    });
  }, [backgroundBoundaries]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    layerRef.current.clearLayers();

    if (value.length >= 3) {
      L.polygon(value.map((c) => [c.lat, c.lng] as [number, number]), {
        color: '#f97316',
        weight: 3,
        fillOpacity: 0.12,
      }).addTo(layerRef.current);
    }

    if (readOnly) {
      value.forEach((c) => {
        L.circleMarker([c.lat, c.lng], {
          radius: 5,
          color: '#ea580c',
          fillColor: '#fb923c',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(layerRef.current);
      });
    } else {
      value.forEach((c, idx) => {
        const marker = L.marker([c.lat, c.lng], { draggable: true }).addTo(layerRef.current);
        marker.on('dragend', () => {
          if (!onChange) return;
          const pos = marker.getLatLng();
          const next = value.map((p, i) => (i === idx ? { lat: pos.lat, lng: pos.lng } : p));
          onChange(next);
        });
      });
    }
  }, [value, onChange, readOnly]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current || !bgLayerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = mapInstanceRef.current;
    const bounds: [number, number][] = [];

    backgroundBoundaries.forEach((b) => {
      b.coordinates.forEach((c) => bounds.push([c.lat, c.lng]));
    });
    value.forEach((c) => bounds.push([c.lat, c.lng]));

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [32, 32], maxZoom: 17 });
    }
  }, [value, backgroundBoundaries]);

  return (
    <div
      ref={mapRef}
      style={{ height: `${height}px`, width: '100%', borderRadius: '8px', zIndex: 0 }}
    />
  );
}
