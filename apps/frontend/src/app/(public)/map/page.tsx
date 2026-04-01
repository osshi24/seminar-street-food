'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { getPublicPins } from '../../../lib/api/map';
import type { PublicPin } from '../../../lib/api/map';
import type { RouteDisplay } from './components/MapView';
import StoreBottomSheet from './components/StoreBottomSheet';
import GpsAutoPlayController from '../../../components/gps/GpsAutoPlayController';
import ShareLocationBtn from './components/ShareLocationBtn';
import { fetchRoute, formatDistance, formatDuration } from '../../../lib/map/osrm';

const MapView = dynamic(() => import('./components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Đang tải bản đồ...
    </div>
  ),
});

interface RouteInfo {
  distance: string;
  duration: string;
  storeName: string;
}

export default function MapPage() {
  const { t } = useTranslation();
  const [pins, setPins] = useState<PublicPin[]>([]);
  const [boundary, setBoundary] = useState<Awaited<ReturnType<typeof getPublicPins>>['boundary']>(null);
  const [selectedPin, setSelectedPin] = useState<PublicPin | null>(null);

  // Routing state
  const [route, setRoute] = useState<RouteDisplay | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

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

  const handleDirections = useCallback(async (destLat: number, destLng: number) => {
    setIsRouting(true);
    setRouteError(null);

    try {
      // Get user location
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('GPS không được hỗ trợ'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, () => {
          reject(new Error('Vui lòng bật GPS để sử dụng chỉ đường'));
        }, { enableHighAccuracy: true, timeout: 10000 });
      });

      const from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const to = { lat: destLat, lng: destLng };

      const result = await fetchRoute(from, to);

      setRoute({
        coordinates: result.coordinates,
        userLocation: [from.lat, from.lng],
      });
      setRouteInfo({
        distance: formatDistance(result.distanceMeters),
        duration: formatDuration(result.durationSeconds),
        storeName: selectedPin?.storeName ?? '',
      });
    } catch (err) {
      setRouteError((err as Error).message);
      // Auto-hide error after 4s
      setTimeout(() => setRouteError(null), 4000);
    } finally {
      setIsRouting(false);
    }
  }, [selectedPin]);

  function clearRoute() {
    setRoute(null);
    setRouteInfo(null);
  }

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Map fills the container */}
      <MapView
        pins={pins}
        boundary={boundary}
        sharedLocation={sharedLocation}
        selectedPinId={selectedPin?.storeId ?? null}
        route={route}
        onPinSelect={(pin) => setSelectedPin(pin)}
        onMapClick={() => setSelectedPin(null)}
      />

      {/* Top-left overlay */}
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

      {/* Route info panel — top center */}
      {routeInfo && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white rounded-xl shadow-lg border border-blue-100 px-4 py-2.5 flex items-center gap-3 max-w-sm">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{routeInfo.storeName}</p>
            <p className="text-xs text-gray-500">
              <span className="font-medium text-blue-600">{routeInfo.distance}</span>
              {' · '}
              <span className="font-medium text-blue-600">{routeInfo.duration}</span>
            </p>
          </div>
          {/* Open in Google Maps */}
          {selectedPin && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPin.latitude},${selectedPin.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Maps"
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {/* Clear route */}
          <button
            onClick={clearRoute}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title={t('map.close')}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Route error toast */}
      {routeError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-red-50 border border-red-200 text-red-700 rounded-lg shadow px-4 py-2 text-sm">
          {routeError}
        </div>
      )}

      {/* Bottom sheet */}
      <StoreBottomSheet
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        onDirections={handleDirections}
        isRouting={isRouting}
      />
    </div>
  );
}
