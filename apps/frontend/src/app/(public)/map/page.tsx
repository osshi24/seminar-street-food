'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { getPublicPins } from '../../../lib/api/map';
import type { PublicPin } from '../../../lib/api/map';
import StoreBottomSheet from './components/StoreBottomSheet';
import GpsAutoPlayController from '../../../components/gps/GpsAutoPlayController';
import ShareLocationBtn from './components/ShareLocationBtn';

const MapView = dynamic(() => import('./components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Đang tải bản đồ...
    </div>
  ),
});

export default function MapPage() {
  const { t } = useTranslation();
  const [pins, setPins] = useState<PublicPin[]>([]);
  const [boundary, setBoundary] = useState<Awaited<ReturnType<typeof getPublicPins>>['boundary']>(null);
  const [selectedPin, setSelectedPin] = useState<PublicPin | null>(null);

  // Read shared location from URL on client
  const [sharedLocation, setSharedLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      setSharedLocation({ lat: Number(lat), lng: Number(lng) });
    }
    // Auto-open panel for a specific store from URL (?storeId=xxx)
    const storeId = params.get('storeId');
    if (storeId) {
      // Will be applied once pins load
      getPublicPins().then((d) => {
        setPins(d.pins);
        setBoundary(d.boundary);
        const target = d.pins.find((p) => p.storeId === storeId);
        if (target) setSelectedPin(target);
      }).catch(() => {});
    } else {
      getPublicPins().then((d) => {
        setPins(d.pins);
        setBoundary(d.boundary);
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Map fills the container */}
      <MapView
        pins={pins}
        boundary={boundary}
        sharedLocation={sharedLocation}
        selectedPinId={selectedPin?.storeId ?? null}
        onPinSelect={(pin) => setSelectedPin(pin)}
        onMapClick={() => setSelectedPin(null)}
      />

      {/* Overlay controls */}
      <div className="absolute top-3 left-3 z-[500] flex gap-2 items-center">
        <div className="bg-white rounded-lg shadow px-3 py-1.5 text-sm font-medium text-gray-700">
          🍜 {pins.length > 0 ? t('map.pinCount', { count: pins.length }) : t('map.title')}
        </div>
        <ShareLocationBtn />
      </div>

      {/* GPS controller — floating top-right */}
      <div className="absolute top-3 right-3 z-[500]">
        <GpsAutoPlayController />
      </div>

      {/* Bottom sheet */}
      <StoreBottomSheet
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
      />
    </div>
  );
}
