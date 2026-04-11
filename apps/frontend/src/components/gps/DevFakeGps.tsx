'use client';

import { useEffect, useState } from 'react';

interface FakeTarget {
  label: string;
  lat: number;
  lng: number;
}

const TARGETS: FakeTarget[] = [
  { label: 'Cơm Tấm Bà Ba', lat: 10.762622, lng: 106.660172 },
  { label: 'Phở Gia Truyền', lat: 10.763100, lng: 106.661000 },
  { label: 'Bánh Mì Hương Xưa', lat: 10.762800, lng: 106.660500 },
  { label: 'Xa tất cả (1km)', lat: 10.770000, lng: 106.670000 },
];

const STORAGE_KEY = 'dev_fake_gps';

function makeFakePosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON() { return this; },
    },
    timestamp: Date.now(),
    toJSON() { return this; },
  };
}

/**
 * Must be called BEFORE any component mounts useGeolocation.
 * Replaces navigator.geolocation methods with fake ones.
 */
export function installFakeGpsFromStorage() {
  if (typeof window === 'undefined') return;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const { lat, lng } = JSON.parse(raw) as { lat: number; lng: number };
    if (!lat || !lng) return;

    const fakePos = makeFakePosition(lat, lng);

    navigator.geolocation.getCurrentPosition = function (success) {
      setTimeout(() => success(fakePos), 50);
    };

    navigator.geolocation.watchPosition = function (success): number {
      const id = setInterval(() => {
        // Re-read in case position changed
        const r = sessionStorage.getItem(STORAGE_KEY);
        if (r) {
          const p = JSON.parse(r);
          success(makeFakePosition(p.lat, p.lng));
        }
      }, 1000);
      // Also emit immediately
      setTimeout(() => success(fakePos), 100);
      return id as unknown as number;
    };
  } catch { /* ignore */ }
}

export default function DevFakeGps() {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Read saved fake on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { label } = JSON.parse(raw);
        if (label) setActive(label);
      } catch { /* ignore */ }
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  function handleSelect(target: FakeTarget) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: target.lat, lng: target.lng, label: target.label }));
    // Reload so the override installs before hooks mount
    window.location.reload();
  }

  function handleReset() {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`rounded-lg px-2.5 py-1.5 text-xs font-mono shadow transition-colors ${
          active
            ? 'bg-orange-500 text-white'
            : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
        }`}
        title="Fake GPS (Dev only)"
      >
        {active ? `📍 ${active}` : '🧪 Fake GPS'}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase">Giả lập vị trí</p>
          {TARGETS.map((t) => (
            <button
              key={t.label}
              onClick={() => handleSelect(t)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-orange-50 transition-colors ${
                active === t.label ? 'bg-orange-50 text-orange-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-xs">📍</span>
              <span className="flex-1 text-left">{t.label}</span>
              <span className="text-[10px] text-gray-400">{t.lat.toFixed(4)}, {t.lng.toFixed(4)}</span>
            </button>
          ))}
          {active && (
            <button
              onClick={handleReset}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
            >
              <span>🔄</span> Reset GPS thật
            </button>
          )}
        </div>
      )}
    </div>
  );
}
