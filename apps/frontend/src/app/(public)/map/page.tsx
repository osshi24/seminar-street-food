'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { getPublicPins } from '../../../lib/api/map';
import type { PublicPin } from '../../../lib/api/map';
import type { RouteDisplay } from './components/MapView';
import StoreBottomSheet from './components/StoreBottomSheet';
import MapSearchOverlay from './components/MapSearchOverlay';
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [navDest, setNavDest] = useState<{ lat: number; lng: number } | null>(null);

  // Fly-to target (from search)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

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
      // Get user location with detailed error handling
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Trình duyệt không hỗ trợ định vị'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error('Bạn cần cho phép truy cập vị trí. Nhấn vào biểu tượng ổ khóa trên thanh địa chỉ → Cho phép Location.'));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error('Không thể xác định vị trí. Vui lòng thử lại.'));
              break;
            case err.TIMEOUT:
              reject(new Error('Định vị quá lâu. Vui lòng thử lại.'));
              break;
            default:
              reject(new Error('Lỗi định vị. Vui lòng thử lại.'));
          }
        }, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        });
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
      setNavDest(to);
      setArrived(false);
    } catch (err) {
      setRouteError((err as Error).message);
      setTimeout(() => setRouteError(null), 8000);
    } finally {
      setIsRouting(false);
    }
  }, [selectedPin]);

  function clearRoute() {
    setRoute(null);
    setRouteInfo(null);
    setIsNavigating(false);
    setArrived(false);
    setNavDest(null);
  }

  function startNavigation() {
    setIsNavigating(true);
    setArrived(false);
  }

  function stopNavigation() {
    setIsNavigating(false);
  }

  // Recalculate route every ~5s when user position updates during navigation
  const lastRecalcRef = useRef(0);
  const handleUserPositionUpdate = useCallback(async (lat: number, lng: number) => {
    if (!navDest || !isNavigating) return;
    const now = Date.now();
    if (now - lastRecalcRef.current < 5000) return;
    lastRecalcRef.current = now;

    try {
      const result = await fetchRoute({ lat, lng }, navDest);
      setRoute({
        coordinates: result.coordinates,
        userLocation: [lat, lng],
      });
      setRouteInfo((prev) => prev ? {
        ...prev,
        distance: formatDistance(result.distanceMeters),
        duration: formatDuration(result.durationSeconds),
      } : null);
    } catch {
      // silent — keep showing existing route
    }
  }, [navDest, isNavigating]);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Map fills the container */}
      <MapView
        pins={pins}
        boundary={boundary}
        sharedLocation={sharedLocation}
        selectedPinId={selectedPin?.storeId ?? null}
        route={route}
        flyTo={flyTo}
        tracking={isNavigating}
        onArrived={() => { setArrived(true); setIsNavigating(false); }}
        onUserPositionUpdate={handleUserPositionUpdate}
        onPinSelect={(pin) => setSelectedPin(pin)}
        onMapClick={() => setSelectedPin(null)}
      />

      {/* Top-left overlay */}
      <div className="absolute top-3 left-3 z-[500] flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <div className="bg-white rounded-lg shadow px-3 py-1.5 text-sm font-medium text-gray-700">
            🍜 {pins.length > 0 ? t('map.pinCount', { count: pins.length }) : t('map.title')}
          </div>
          <ShareLocationBtn />
        </div>
        <MapSearchOverlay
          pins={pins}
          onSelectPin={(pin) => {
            setSelectedPin(pin);
            setFlyTo({ lat: Number(pin.latitude), lng: Number(pin.longitude) });
          }}
        />
      </div>

      {/* GPS controller — floating top-right */}
      <div className="absolute top-3 right-3 z-[500]">
        <GpsAutoPlayController />
      </div>

      {/* Route info / Navigation panel — bottom center */}
      {routeInfo && (
        <div className={`absolute z-[500] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md ${isNavigating ? 'bottom-4' : 'top-3'}`}>
          {/* Arrived banner */}
          {arrived && (
            <div className="bg-green-500 text-white rounded-xl shadow-lg px-5 py-4 mb-2 text-center">
              <p className="text-lg font-bold">Bạn đã đến nơi!</p>
              <p className="text-sm opacity-90">{routeInfo.storeName}</p>
              <button onClick={clearRoute} className="mt-2 rounded-lg bg-white/20 px-4 py-1.5 text-sm font-medium hover:bg-white/30 transition-colors">
                Đóng
              </button>
            </div>
          )}

          {!arrived && (
            <div className={`rounded-xl shadow-lg border overflow-hidden ${isNavigating ? 'bg-blue-600 border-blue-500' : 'bg-white border-blue-100'}`}>
              {/* Info row */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isNavigating ? 'bg-blue-500' : 'bg-blue-100'}`}>
                  {isNavigating ? (
                    <svg className="h-5 w-5 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isNavigating ? 'text-white' : 'text-gray-900'}`}>
                    {routeInfo.storeName}
                  </p>
                  <p className={`text-xs ${isNavigating ? 'text-blue-200' : 'text-gray-500'}`}>
                    <span className={`font-medium ${isNavigating ? 'text-white' : 'text-blue-600'}`}>{routeInfo.distance}</span>
                    {' · '}
                    <span className={`font-medium ${isNavigating ? 'text-white' : 'text-blue-600'}`}>{routeInfo.duration}</span>
                  </p>
                </div>
                {/* Close */}
                <button
                  onClick={clearRoute}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isNavigating ? 'text-blue-300 hover:text-white hover:bg-blue-500' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Action buttons */}
              <div className={`px-4 pb-3 flex gap-2 ${isNavigating ? '' : 'border-t border-gray-100 pt-2'}`}>
                {!isNavigating ? (
                  <>
                    <button
                      onClick={startNavigation}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                      </svg>
                      Bắt đầu đi
                    </button>
                    {selectedPin && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1${route?.userLocation ? `&origin=${route.userLocation[0]},${route.userLocation[1]}` : ''}&destination=${selectedPin.latitude},${selectedPin.longitude}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Google Maps
                      </a>
                    )}
                  </>
                ) : (
                  <button
                    onClick={stopNavigation}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z" />
                    </svg>
                    Dừng điều hướng
                  </button>
                )}
              </div>
            </div>
          )}
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
