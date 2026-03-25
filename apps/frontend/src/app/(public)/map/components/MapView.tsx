'use client';

import { useEffect, useRef } from 'react';
import { initLeafletIcons } from '../../../../lib/map/leaflet-config';
import { PublicPin, BoundaryData } from '../../../../lib/api/map';

export interface RouteDisplay {
  coordinates: [number, number][];
  userLocation: [number, number];
}

interface MapViewProps {
  pins: PublicPin[];
  boundary: BoundaryData | null;
  sharedLocation?: { lat: number; lng: number };
  selectedPinId?: string | null;
  route?: RouteDisplay | null;
  flyTo?: { lat: number; lng: number } | null;
  onPinSelect: (pin: PublicPin) => void;
  onMapClick: () => void;
}

function buildStoreIcon(pin: PublicPin, isSelected: boolean) {
  const size = isSelected ? 56 : 48;
  const border = isSelected ? '3px solid #f97316' : '2px solid #fff';
  const shadow = isSelected
    ? '0 0 0 4px rgba(249,115,22,0.3), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 6px rgba(0,0,0,0.25)';
  const pulseRing = isSelected
    ? '<div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(249,115,22,0.25);animation:pulse-ring 1.2s ease-out infinite"></div>'
    : '';

  const imgHtml = pin.thumbnailUrl
    ? `<img src="${pin.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${isSelected ? 18 : 16}px">${pin.storeName.charAt(0)}</div>`;

  const label = `<div style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:500;max-width:100px;overflow:hidden;text-overflow:ellipsis;pointer-events:none">${pin.storeName}</div>`;

  const html =
    `<div style="position:relative;width:${size}px;display:flex;flex-direction:column;align-items:center">` +
    pulseRing +
    `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${shadow};overflow:hidden;background:#fff">` +
    imgHtml +
    '</div>' +
    label +
    '</div>';

  return html;
}

export default function MapView({
  pins,
  boundary,
  sharedLocation,
  selectedPinId,
  route,
  flyTo,
  onPinSelect,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinsRef = useRef<Map<string, PublicPin>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundaryLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // Track callbacks in refs so map event handlers always use latest
  const onPinSelectRef = useRef(onPinSelect);
  onPinSelectRef.current = onPinSelect;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Init map (once)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const map = L.map(mapRef.current).setView([10.762622, 106.660172], 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Shared location marker (blue)
    if (sharedLocation) {
      const sharedIcon = L.divIcon({
        html: '<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([sharedLocation.lat, sharedLocation.lng], { icon: sharedIcon })
        .bindPopup('Vị trí được chia sẻ')
        .addTo(map);
      map.flyTo([sharedLocation.lat, sharedLocation.lng], 17);
    }

    // Click on empty map → close sheet
    map.on('click', () => {
      onMapClickRef.current();
    });

    // "Locate me" button
    const LocateControl = L.Control.extend({
      onAdd() {
        const btn = L.DomUtil.create('button', '');
        btn.innerHTML = '📍';
        btn.title = 'Định vị tôi';
        btn.style.cssText =
          'background:white;border:2px solid #ccc;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:16px;line-height:1;';
        L.DomEvent.on(btn, 'click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((pos) => {
            map.flyTo([pos.coords.latitude, pos.coords.longitude], 17);
          });
        });
        return btn;
      },
    });
    new LocateControl({ position: 'bottomright' }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      pinsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync boundary when data arrives
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !boundary || boundary.coordinates.length < 3) return;
    if (boundaryLayerRef.current) return; // already drawn
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const boundaryPolygon = L.polygon(
      boundary.coordinates.map((c) => [c.lat, c.lng] as [number, number]),
      { color: '#f97316', fillOpacity: 0.08, weight: 2 },
    ).addTo(map);
    boundaryLayerRef.current = boundaryPolygon;

    // Fit map to boundary so user sees the whole street immediately
    if (!sharedLocation) {
      map.fitBounds(boundaryPolygon.getBounds(), { padding: [40, 40] });
    }
  }, [boundary, sharedLocation]);

  // Sync pins when data arrives or changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || pins.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    // Remove old markers that no longer exist
    markersRef.current.forEach((marker, storeId) => {
      if (!pins.find((p) => p.storeId === storeId)) {
        map.removeLayer(marker);
        markersRef.current.delete(storeId);
        pinsRef.current.delete(storeId);
      }
    });

    // Add new markers
    pins.forEach((pin) => {
      if (markersRef.current.has(pin.storeId)) return; // already on map
      pinsRef.current.set(pin.storeId, pin);
      const iconSize = 48;
      const icon = L.divIcon({
        html: buildStoreIcon(pin, false),
        className: '',
        iconSize: [iconSize, iconSize + 18],
        iconAnchor: [iconSize / 2, iconSize / 2],
      });
      const marker = L.marker([Number(pin.latitude), Number(pin.longitude)], { icon }).addTo(map);
      marker.on('click', () => {
        onPinSelectRef.current(pin);
      });
      markersRef.current.set(pin.storeId, marker);
    });

    // Fit to pins if no boundary
    if (!boundaryLayerRef.current && pins.length > 1 && !sharedLocation) {
      const group = L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    }
  }, [pins, sharedLocation]);

  // Update icons when selected pin changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    markersRef.current.forEach((marker, storeId) => {
      const pin = pinsRef.current.get(storeId);
      if (!pin) return;
      const isSelected = storeId === selectedPinId;
      const size = isSelected ? 56 : 48;
      marker.setIcon(
        L.divIcon({
          html: buildStoreIcon(pin, isSelected),
          className: '',
          iconSize: [size, size + 18],
          iconAnchor: [size / 2, size / 2],
        }),
      );
    });
  }, [selectedPinId]);

  // Fly to location (from search)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyTo) return;
    map.flyTo([flyTo.lat, flyTo.lng], 18, { duration: 0.8 });
  }, [flyTo]);

  // Draw / clear route polyline + user location marker
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const map = mapInstanceRef.current;
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    // Clear previous route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (!route) return;

    // Draw polyline
    const polyline = L.polyline(route.coordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.8,
      dashArray: '10 6',
    }).addTo(map);
    routeLayerRef.current = polyline;

    // User location marker (blue pulsing dot)
    const userIcon = L.divIcon({
      html:
        '<div style="position:relative;width:20px;height:20px">' +
        '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.3);animation:pulse-ring 1.5s ease-out infinite"></div>' +
        '<div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>' +
        '</div>',
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const userMarker = L.marker(route.userLocation, { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map);
    userMarkerRef.current = userMarker;

    // Fit map to show entire route
    map.fitBounds(polyline.getBounds(), { padding: [60, 60] });
  }, [route]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="rounded-none"
      />
    </>
  );
}
