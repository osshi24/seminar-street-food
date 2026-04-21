'use client';

import { useEffect, useRef } from 'react';
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
  tracking?: boolean;
  onArrived?: () => void;
  onUserPositionUpdate?: (lat: number, lng: number) => void;
  onPinSelect: (pin: PublicPin) => void;
  onMapClick: () => void;
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEFAULT_CENTER: [number, number] = [106.660172, 10.762622];
const DEFAULT_ZOOM = 16;

function buildStoreIconHtml(pin: PublicPin, isSelected: boolean): string {
  const size = isSelected ? 56 : 48;
  const border = isSelected ? '3px solid #f97316' : '2px solid #fff';
  const shadow = isSelected
    ? '0 0 0 4px rgba(249,115,22,0.3), 0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 6px rgba(0,0,0,0.25)';
  const pulseRing = isSelected
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(249,115,22,0.25);animation:pulse-ring 1.2s ease-out infinite"></div>`
    : '';
  const imgHtml = pin.thumbnailUrl
    ? `<img src="${pin.thumbnailUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${isSelected ? 18 : 16}px">${pin.storeName.charAt(0)}</div>`;
  const label = `<div style="position:absolute;top:${size + 2}px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:1px 6px;border-radius:4px;font-weight:500;max-width:100px;overflow:hidden;text-overflow:ellipsis;pointer-events:none">${pin.storeName}</div>`;
  return (
    `<div style="position:relative;width:${size}px;display:flex;flex-direction:column;align-items:center">` +
    pulseRing +
    `<div style="width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${shadow};overflow:hidden;background:#fff">` +
    imgHtml + '</div>' + label + '</div>'
  );
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapView({
  pins,
  boundary,
  sharedLocation,
  selectedPinId,
  route,
  flyTo,
  tracking = false,
  onArrived,
  onUserPositionUpdate,
  onPinSelect,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const mapLoadedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinMarkersRef = useRef<Map<string, any>>(new Map());
  const pinsDataRef = useRef<Map<string, PublicPin>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLocationMarkerRef = useRef<any>(null);
  const myPositionRef = useRef<[number, number] | null>(null); // [lat, lng]
  const gpsWatchIdRef = useRef<number | null>(null);
  const boundaryFittedRef = useRef(false);

  // Keep latest callbacks in refs (stable across renders)
  const onPinSelectRef = useRef(onPinSelect);
  onPinSelectRef.current = onPinSelect;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;
  const onUserPositionUpdateRef = useRef(onUserPositionUpdate);
  onUserPositionUpdateRef.current = onUserPositionUpdate;

  // Snapshot refs so load callback captures latest data
  const pinsSnapRef = useRef(pins);
  pinsSnapRef.current = pins;
  const boundarySnapRef = useRef(boundary);
  boundarySnapRef.current = boundary;

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    mapInstanceRef.current = map;

    // Fly to shared location if provided
    if (sharedLocation) {
      map.setCenter([sharedLocation.lng, sharedLocation.lat]);
      map.setZoom(17);
    }

    map.on('click', () => onMapClickRef.current());

    // Always-on live user position (blue dot)
    if (navigator.geolocation) {
      const dotEl = document.createElement('div');
      dotEl.style.cssText = 'position:relative;width:20px;height:20px;pointer-events:none';
      dotEl.innerHTML =
        '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);animation:pulse-ring 1.5s ease-out infinite"></div>' +
        '<div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>';

      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          myPositionRef.current = [lat, lng];
          try {
            if (!myLocationMarkerRef.current) {
              myLocationMarkerRef.current = new maplibregl.Marker({ element: dotEl, anchor: 'center' })
                .setLngLat([lng, lat])
                .addTo(map);
            } else {
              myLocationMarkerRef.current.setLngLat([lng, lat]);
            }
          } catch { /* map removed */ }
        },
        undefined,
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 60000 },
      );
    }

    // Locate-me control
    class LocateControl {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onAdd(m: any) {
        const btn = document.createElement('button');
        btn.className = 'maplibregl-ctrl-icon';
        btn.title = 'Định vị tôi';
        btn.style.cssText =
          'background:white;border:none;border-radius:6px;padding:6px;cursor:pointer;font-size:18px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);';
        btn.innerHTML = '📍';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (myPositionRef.current) {
            m.flyTo({ center: [myPositionRef.current[1], myPositionRef.current[0]], zoom: 17, duration: 600 });
            return;
          }
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => m.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17 }),
            undefined,
            { timeout: 10000, enableHighAccuracy: false },
          );
        });
        const div = document.createElement('div');
        div.className = 'maplibregl-ctrl';
        div.appendChild(btn);
        return div;
      }
      onRemove() {}
    }
    map.addControl(new LocateControl(), 'bottom-right');

    map.once('load', () => {
      mapLoadedRef.current = true;

      // ── Boundary source + layer ──
      map.addSource('boundary', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] }, properties: {} },
      });
      map.addLayer({
        id: 'boundary-fill',
        type: 'fill',
        source: 'boundary',
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'boundary',
        paint: { 'line-color': '#f97316', 'line-width': 2 },
      });

      // ── Route source + layer ──
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 },
      });

      // Populate initial data
      const snap = pinsSnapRef.current;
      if (snap.length > 0) addPinMarkers(map, maplibregl, snap);

      const bSnap = boundarySnapRef.current;
      if (bSnap && bSnap.coordinates.length >= 3) {
        updateBoundary(map, bSnap);
      }
    });

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      mapLoadedRef.current = false;
      pinMarkersRef.current.clear();
      pinsDataRef.current.clear();
      myLocationMarkerRef.current = null;
      boundaryFittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addPinMarkers(map: any, maplibregl: any, pinsArr: PublicPin[]) {
    pinsArr.forEach((pin) => {
      if (pinMarkersRef.current.has(pin.storeId)) return;
      pinsDataRef.current.set(pin.storeId, pin);

      const el = document.createElement('div');
      el.innerHTML = buildStoreIconHtml(pin, false);
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPinSelectRef.current(pin);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([Number(pin.longitude), Number(pin.latitude)])
        .addTo(map);
      pinMarkersRef.current.set(pin.storeId, marker);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateBoundary(map: any, b: BoundaryData) {
    const src = map.getSource('boundary');
    if (!src) return;
    const ring = b.coordinates.map((c) => [c.lng, c.lat]);
    // Close ring
    if (ring.length > 0) ring.push(ring[0]);
    src.setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {},
    });

    if (!boundaryFittedRef.current && !sharedLocation) {
      const lngs = b.coordinates.map((c) => c.lng);
      const lats = b.coordinates.map((c) => c.lat);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 50, duration: 800 },
      );
      boundaryFittedRef.current = true;
    }
  }

  // ── Sync pins ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoadedRef.current || pins.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');
    addPinMarkers(map, maplibregl, pins);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  // ── Sync boundary ────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoadedRef.current || !boundary || boundary.coordinates.length < 3) return;
    updateBoundary(map, boundary);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundary]);

  // ── Update selected marker icon ──────────────────────────────────────────────
  useEffect(() => {
    pinMarkersRef.current.forEach((marker, storeId) => {
      const pin = pinsDataRef.current.get(storeId);
      if (!pin) return;
      const isSelected = storeId === selectedPinId;
      const el = marker.getElement();
      el.innerHTML = buildStoreIconHtml(pin, isSelected);
    });
  }, [selectedPinId]);

  // ── Fly to (search / QR) ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyTo) return;
    map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 18, duration: 800 });
  }, [flyTo]);

  // ── Draw / clear route ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoadedRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maplibregl = require('maplibre-gl');

    const src = map.getSource('route');
    if (!route) {
      src?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
      return;
    }

    // [lat, lng] → [lng, lat]
    const coords = route.coordinates.map(([lat, lng]) => [lng, lat]);
    src?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
      properties: {},
    });

    // Fit to route bounds
    const allLngs = coords.map(([lng]) => lng);
    const allLats = coords.map(([, lat]) => lat);
    map.fitBounds(
      [[Math.min(...allLngs), Math.min(...allLats)], [Math.max(...allLngs), Math.max(...allLats)]],
      { padding: 60, duration: 600 },
    );
  }, [route]);

  // ── Real-time GPS tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (!tracking || !route) return;
    const map = mapInstanceRef.current;
    if (!map || !navigator.geolocation) return;

    const destLat = route.coordinates[route.coordinates.length - 1][0];
    const destLng = route.coordinates[route.coordinates.length - 1][1];

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          map.easeTo({ center: [lng, lat], duration: 500 });
          if (myLocationMarkerRef.current) myLocationMarkerRef.current.setLngLat([lng, lat]);
        } catch { /* map destroyed */ }
        onUserPositionUpdateRef.current?.(lat, lng);
        if (haversineDistance(lat, lng, destLat, destLng) < 50) onArrivedRef.current?.();
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 3000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracking, !!route]);

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }} />
    </>
  );
}
