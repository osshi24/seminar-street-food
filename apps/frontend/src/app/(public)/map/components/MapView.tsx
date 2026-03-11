'use client';

import { useEffect, useRef } from 'react';
import { initLeafletIcons } from '../../../../lib/map/leaflet-config';
import { PublicPin, BoundaryData } from '../../../../lib/api/map';

interface MapViewProps {
  pins: PublicPin[];
  boundary: BoundaryData | null;
  sharedLocation?: { lat: number; lng: number };
  selectedPinId?: string | null;
  onPinSelect: (pin: PublicPin) => void;
  onMapClick: () => void;
}

export default function MapView({
  pins,
  boundary,
  sharedLocation,
  selectedPinId,
  onPinSelect,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    initLeafletIcons();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const defaultCenter: [number, number] = sharedLocation
      ? [sharedLocation.lat, sharedLocation.lng]
      : pins.length > 0
      ? [Number(pins[0].latitude), Number(pins[0].longitude)]
      : [10.762622, 106.660172];

    const map = L.map(mapRef.current).setView(defaultCenter, 16);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Draw boundary
    if (boundary && boundary.coordinates.length >= 3) {
      L.polygon(
        boundary.coordinates.map((c) => [c.lat, c.lng] as [number, number]),
        { color: '#f97316', fillOpacity: 0.08, weight: 2 },
      ).addTo(map);
    }

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

    // Store pins
    pins.forEach((pin) => {
      const marker = L.marker([Number(pin.latitude), Number(pin.longitude)]).addTo(map);
      marker.on('click', () => {
        onPinSelect(pin);
      });
      markersRef.current.set(pin.storeId, marker);
    });

    // Click on empty map → close sheet
    map.on('click', () => {
      onMapClick();
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pulse animation on selected / nearby pin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet');

    const CDN = 'https://unpkg.com/leaflet@1.9.4/dist/images';
    const pulseHtml =
      '<div style="position:relative;width:32px;height:32px">' +
      '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(249,115,22,0.3);animation:pulse-ring 1.2s ease-out infinite"></div>' +
      `<img src="${CDN}/marker-icon.png" style="position:absolute;left:3px;top:0;width:25px;height:41px" />` +
      '</div>';

    markersRef.current.forEach((marker, storeId) => {
      if (storeId === selectedPinId) {
        marker.setIcon(
          L.divIcon({ html: pulseHtml, className: '', iconSize: [32, 45], iconAnchor: [16, 45] }),
        );
      } else {
        marker.setIcon(L.icon({
          iconUrl: `${CDN}/marker-icon.png`,
          shadowUrl: `${CDN}/marker-shadow.png`,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        }));
      }
    });
  }, [selectedPinId]);

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
