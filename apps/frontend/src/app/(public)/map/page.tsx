'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getPublicPins } from '../../../lib/api/map';
import type { PublicPin } from '../../../lib/api/map';
import type { RouteDisplay } from './components/MapView';
import StoreBottomSheet from './components/StoreBottomSheet';
import MapSearchOverlay from './components/MapSearchOverlay';
import GpsPermissionBanner from './components/GpsPermissionBanner';
import GpsAutoPlayController from '../../../components/gps/GpsAutoPlayController';
import DevFakeGps, { installFakeGpsFromStorage } from '../../../components/gps/DevFakeGps';

// Install fake GPS override BEFORE any hooks run
if (typeof window !== 'undefined') {
  installFakeGpsFromStorage();
}
import { fetchRoute, formatDistance, formatDuration } from '../../../lib/map/osrm';

const PENDING_QR_SCAN_KEY = 'pending_qr_scan';

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

interface BoundaryQrData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
}

interface PendingQrScan {
  storeId: string;
  source: 'qr';
  autoplayCommentary: boolean;
  qrNonce: string;
}

function boundaryCenter(coords: { lat: number; lng: number }[]) {
  return {
    lat: coords.reduce((s, c) => s + c.lat, 0) / coords.length,
    lng: coords.reduce((s, c) => s + c.lng, 0) / coords.length,
  };
}

export default function MapPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pins, setPins] = useState<PublicPin[]>([]);
  const [boundary, setBoundary] = useState<Awaited<ReturnType<typeof getPublicPins>>['boundary']>(null);
  const [selectedPin, setSelectedPin] = useState<PublicPin | null>(null);
  const [boundaryQr, setBoundaryQr] = useState<BoundaryQrData | null>(null);
  const [qrFocus, setQrFocus] = useState<{ storeId: string; nonce: string } | null>(null);
  const [qrSessionKey, setQrSessionKey] = useState<string | null>(null);
  const pinsLoadedRef = useRef(false);
  const lastQrNonceRef = useRef<string | null>(null);
  const suppressMapClickUntilRef = useRef(0);

  // Routing
  const [route, setRoute] = useState<RouteDisplay | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [arrived, setArrived] = useState(false);

  // Fly-to (search / QR)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  // Shared location from URL
  const [sharedLocation, setSharedLocation] = useState<{ lat: number; lng: number } | undefined>();

  // Stores dismissed by user — don't auto-reopen
  const dismissedRef = useRef<Set<string>>(new Set());

  const applyQrScan = useCallback((scan: PendingQrScan) => {
    if (!scan.storeId) return;
    if (lastQrNonceRef.current === scan.qrNonce) return;

    lastQrNonceRef.current = scan.qrNonce;
    suppressMapClickUntilRef.current = Date.now() + 1500;
    setQrSessionKey(scan.qrNonce);
    setSelectedPin(null);
    setBoundaryQr(null);
    setRoute(null);
    setRouteInfo(null);
    setQrFocus({
      storeId: scan.storeId,
      nonce: scan.qrNonce,
    });

    const openPin = (pinList: PublicPin[]) => {
      const target = pinList.find((p) => p.storeId === scan.storeId);
      if (target) {
        dismissedRef.current.delete(scan.storeId);
        setSelectedPin(target);
        setFlyTo({ lat: Number(target.latitude), lng: Number(target.longitude) });
        return;
      }

      router.replace(`/stores/${scan.storeId}`);
    };

    if (pinsLoadedRef.current && pins.length > 0) {
      openPin(pins);
      return;
    }

    getPublicPins().then((d) => {
      setPins(d.pins);
      setBoundary(d.boundary);
      pinsLoadedRef.current = true;
      openPin(d.pins);
    }).catch(() => {});
  }, [pins, router]);

  // Load pins once
  useEffect(() => {
    getPublicPins().then((d) => {
      setPins(d.pins);
      setBoundary(d.boundary);
      pinsLoadedRef.current = true;
    }).catch(() => {});
  }, []);

  // React to URL param changes (initial load + after QR scan navigation)
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      setSharedLocation({ lat: Number(lat), lng: Number(lng) });
    }

    const boundaryQrId = searchParams.get('boundaryQrId');
    if (boundaryQrId) {
      const raw = sessionStorage.getItem(`boundary_qr_${boundaryQrId}`);
      if (raw) {
        try {
          const data = JSON.parse(raw) as BoundaryQrData;
          setBoundaryQr(data);
          setFlyTo(boundaryCenter(data.coordinates));
        } catch { /* ignore */ }
      }
    }

    const storeId = searchParams.get('storeId');
    const scanSource = searchParams.get('source');
    const autoplayCommentary = searchParams.get('autoplayCommentary') === '1';
    const qrNonce = searchParams.get('qrNonce');

    if (scanSource === 'qr' && autoplayCommentary && storeId) {
      applyQrScan({
        storeId,
        source: 'qr',
        autoplayCommentary: true,
        qrNonce: qrNonce ?? `${storeId}-qr`,
      });
      return;
    }

    if (storeId) {
      const target = pins.find((p) => p.storeId === storeId);
      if (target) {
        setSelectedPin(target);
        setFlyTo({ lat: Number(target.latitude), lng: Number(target.longitude) });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyQrScan, pins, searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const raw = sessionStorage.getItem(PENDING_QR_SCAN_KEY);
    if (raw) {
      try {
        applyQrScan(JSON.parse(raw) as PendingQrScan);
        sessionStorage.removeItem(PENDING_QR_SCAN_KEY);
      } catch {
        // ignore malformed payload
      }
    }

    const handleQrScan = (event: Event) => {
      const customEvent = event as CustomEvent<PendingQrScan>;
      if (customEvent.detail) {
        applyQrScan(customEvent.detail);
        sessionStorage.removeItem(PENDING_QR_SCAN_KEY);
      }
    };

    window.addEventListener('qr-scan', handleQrScan as EventListener);
    return () => window.removeEventListener('qr-scan', handleQrScan as EventListener);
  }, [applyQrScan]);

  const handleDirections = useCallback(async (destLat: number, destLng: number): Promise<boolean> => {
    setIsRouting(true);
    setRouteError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error(t('map.geolocationNotSupported'))); return;
        }
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:   reject(new Error(t('map.permissionRequired'))); break;
            case err.POSITION_UNAVAILABLE: reject(new Error(t('map.positionUnavailable'))); break;
            case err.TIMEOUT:             reject(new Error(t('map.geolocationTimeout'))); break;
            default:                      reject(new Error(t('map.geolocationError')));
          }
        }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
      });

      const from = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const to = { lat: destLat, lng: destLng };
      const result = await fetchRoute(from, to);

      setRoute({ coordinates: result.coordinates, userLocation: [from.lat, from.lng] });
      setRouteInfo({
        distance: formatDistance(result.distanceMeters),
        duration: formatDuration(result.durationSeconds),
        storeName: selectedPin?.storeName ?? boundaryQr?.name ?? '',
      });
      return true;
    } catch (err) {
      setRouteError((err as Error).message);
      setTimeout(() => setRouteError(null), 8000);
      return false;
    } finally {
      setIsRouting(false);
    }
  }, [selectedPin, boundaryQr, t]);

  const handleStartNavigation = useCallback(async (destLat: number, destLng: number) => {
    let ok = !!route;
    if (!ok) ok = await handleDirections(destLat, destLng);
    if (ok) {
      setArrived(false);
      setIsNavigating(true);
    }
  }, [route, handleDirections]);

  function handleStopNavigation() {
    setIsNavigating(false);
    setArrived(false);
    setRoute(null);
    setRouteInfo(null);
  }

  function clearRoute() {
    setRoute(null);
    setRouteInfo(null);
  }

  const isQrFocusedStore = !!qrFocus && qrFocus.storeId === selectedPin?.storeId;

  return (
    // Mobile: fixed full-screen (map behind bottom tab bar, overlays float above).
    // Desktop (sm+): normal flow below the 64px header.
    <div className="fixed inset-0 sm:relative sm:inset-auto sm:w-full sm:h-[calc(100dvh-64px)]">
      <GpsPermissionBanner />
      {/* Map fills the container */}
      <MapView
        pins={pins}
        boundary={boundary}
        sharedLocation={sharedLocation}
        selectedPinId={selectedPin?.storeId ?? null}
        route={route}
        flyTo={flyTo}
        tracking={isNavigating && !arrived}
        onArrived={() => setArrived(true)}
        onUserPositionUpdate={(pos) => setFlyTo({ lat: pos[0], lng: pos[1] })}
        onPinSelect={(pin) => {
          setBoundaryQr(null);
          setQrFocus(null);
          setSelectedPin(pin);
        }}
        onMapClick={() => {
          if (Date.now() < suppressMapClickUntilRef.current) return;
          setQrFocus(null);
          setSelectedPin(null);
        }}
      />

      {/* Top-left overlay */}
      <div className="absolute top-3 left-3 z-[500]">
        <MapSearchOverlay
          pins={pins}
          onSelectPin={(pin) => {
            setSelectedPin(pin);
            setFlyTo({ lat: Number(pin.latitude), lng: Number(pin.longitude) });
          }}
        />
      </div>

      {/* GPS controller + Fake GPS — top right */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
        <GpsAutoPlayController />
        <DevFakeGps />
      </div>

      {/* Route error toast */}
      {routeError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] bg-red-50 border border-red-200 text-red-700 rounded-xl shadow px-4 py-2 text-sm whitespace-nowrap">
          {routeError}
        </div>
      )}

      {/* Route info bar (shown when there's a route but no store sheet open and not navigating) */}
      {routeInfo && !selectedPin && !boundaryQr && !isNavigating && (
        <div className="absolute bottom-24 sm:bottom-4 left-3 right-3 z-[400]">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Tuyến đường</p>
              <p className="font-semibold text-gray-900 truncate">{routeInfo.storeName}</p>
              <p className="text-xs mt-0.5">
                <span className="font-semibold text-orange-600">{routeInfo.distance}</span>
                <span className="text-gray-400"> · </span>
                <span className="font-semibold text-orange-600">{routeInfo.duration}</span>
              </p>
            </div>
            <button
              onClick={clearRoute}
              className="shrink-0 p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Boundary QR card */}
      {boundaryQr && !selectedPin && (
        <div className="absolute bottom-24 sm:bottom-4 left-3 right-3 z-[400]">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium">Khu vực hoạt động</p>
              <p className="font-semibold text-gray-900 truncate">{boundaryQr.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDirections(...Object.values(boundaryCenter(boundaryQr.coordinates)) as [number, number])}
                disabled={isRouting}
                className="px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
              >
                {isRouting ? '...' : 'Chỉ đường'}
              </button>
              <button onClick={() => setBoundaryQr(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store bottom sheet */}
      <StoreBottomSheet
        key={`${selectedPin?.storeId ?? 'none'}-${qrSessionKey ?? 'default'}`}
        pin={selectedPin}
        autoExpand={isQrFocusedStore}
        autoShowCommentary={isQrFocusedStore}
        autoPlayCommentaryKey={isQrFocusedStore ? qrFocus?.nonce ?? null : null}
        onAutoPlayCommentaryHandled={() => {}}
        onClose={() => {
          if (selectedPin) dismissedRef.current.add(selectedPin.storeId);
          setQrFocus(null);
          setSelectedPin(null);
          if (isNavigating) handleStopNavigation();
        }}
        onDirections={handleDirections}
        onStartNavigation={handleStartNavigation}
        onStopNavigation={handleStopNavigation}
        isRouting={isRouting}
        routeInfo={routeInfo ? { distance: routeInfo.distance, duration: routeInfo.duration } : null}
        isNavigating={isNavigating}
        arrived={arrived}
      />
    </div>
  );
}
