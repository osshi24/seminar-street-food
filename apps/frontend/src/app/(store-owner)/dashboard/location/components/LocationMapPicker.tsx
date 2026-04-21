'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Coordinate {
  lat: number;
  lng: number;
}

interface OtherPin {
  storeId: string;
  storeName: string | null;
  thumbnailUrl?: string | null;
  lat: number;
  lng: number;
  isPending?: boolean;
}

interface LocationMapPickerProps {
  center?: Coordinate;
  initialMarker?: Coordinate | null;
  boundary?: Coordinate[] | null;
  otherPins?: OtherPin[];
  height?: string;
  onCoordinateChange: (lat: number, lng: number) => void;
}

function buildDotMarker(pin: OtherPin): HTMLElement {
  const isPending = pin.isPending ?? false;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: relative; display: flex; align-items: center; justify-content: center; cursor: default;';

  // Tooltip above dot
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    background: white; color: #1e293b;
    border-radius: 5px; padding: 2px 7px;
    font-size: 11px; font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    border: 1px solid #e2e8f0;
    display: none; pointer-events: none; z-index: 10;
  `;
  const label = document.createElement('span');
  label.textContent = pin.storeName ?? 'Gian hàng';
  tooltip.appendChild(label);
  if (isPending) {
    const badge = document.createElement('span');
    badge.textContent = ' · Đang chờ';
    badge.style.cssText = 'color: #d97706; font-weight: 500;';
    tooltip.appendChild(badge);
  }

  // Dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    width: 14px; height: 14px;
    border-radius: 50%;
    background: ${isPending ? '#fb923c' : '#6366f1'};
    border: 2.5px solid white;
    box-shadow: 0 1px 5px rgba(0,0,0,0.35);
    ${isPending ? 'opacity: 0.85;' : ''}
  `;

  wrapper.appendChild(tooltip);
  wrapper.appendChild(dot);

  dot.addEventListener('mouseenter', () => { tooltip.style.display = 'block'; });
  dot.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

  return wrapper;
}


export default function LocationMapPicker({
  center = { lat: 10.762622, lng: 106.660172 },
  initialMarker,
  boundary,
  otherPins,
  height = '360px',
  onCoordinateChange,
}: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const boundaryRef = useRef(boundary);
  const otherPinsRef = useRef(otherPins ?? []);

  const handleCoordChange = useCallback(onCoordinateChange, [onCoordinateChange]);

  const fitToBoundary = useCallback(() => {
    const map = mapInstanceRef.current;
    const b = boundaryRef.current;
    if (!map || !b || b.length < 3) return;
    const lngs = b.map((c) => c.lng);
    const lats = b.map((c) => c.lat);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 60, maxZoom: 17 },
    );
  }, []);

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

    // Draggable marker for current store
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
      const b = boundaryRef.current;
      if (b && b.length >= 3) {
        map.addSource('boundary', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [...b.map((c) => [c.lng, c.lat]), [b[0].lng, b[0].lat]],
              ],
            },
            properties: {},
          },
        });
        map.addLayer({
          id: 'boundary-fill',
          type: 'fill',
          source: 'boundary',
          paint: { 'fill-color': '#f97316', 'fill-opacity': 0.12 },
        });
        map.addLayer({
          id: 'boundary-line',
          type: 'line',
          source: 'boundary',
          paint: { 'line-color': '#f97316', 'line-width': 2, 'line-dasharray': [4, 2] },
        });

        if (!initialMarker) {
          const lngs = b.map((c) => c.lng);
          const lats = b.map((c) => c.lat);
          map.fitBounds(
            [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
            { padding: 60, maxZoom: 17 },
          );
        }
      }

      // Render other stores as dot markers
      for (const pin of otherPinsRef.current) {
        new maplibregl.Marker({ element: buildDotMarker(pin), anchor: 'center' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        style={{ height, width: '100%', borderRadius: 0, zIndex: 0 }}
      />
      {boundary && boundary.length >= 3 && (
        <button
          type="button"
          onClick={fitToBoundary}
          title="Về khu ẩm thực"
          className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              fillRule="evenodd"
              d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
              clipRule="evenodd"
            />
          </svg>
          Về khu ẩm thực
        </button>
      )}
    </div>
  );
}
