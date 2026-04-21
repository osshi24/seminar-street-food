'use client';

import { useState } from 'react';

const STORAGE_KEY = 'dev_fake_gps';

export function installFakeGpsFromStorage(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const { lat, lng } = JSON.parse(raw) as { lat: number; lng: number };
    overrideGeolocation(lat, lng);
  } catch { /* ignore */ }
}

function overrideGeolocation(lat: number, lng: number) {
  const makePosition = (): GeolocationPosition => ({
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigator as any).geolocation = {
    getCurrentPosition: (success: PositionCallback) => success(makePosition()),
    watchPosition: (success: PositionCallback) => {
      success(makePosition());
      return 0;
    },
    clearWatch: () => {},
  };
}

export default function DevFakeGps() {
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [active, setActive] = useState(() => !!localStorage.getItem(STORAGE_KEY));

  if (process.env.NODE_ENV === 'production') return null;

  function handleApply() {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (isNaN(la) || isNaN(ln)) return;
    const data = { lat: la, lng: ln };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    overrideGeolocation(la, ln);
    setActive(true);
    setOpen(false);
  }

  function handleClear() {
    localStorage.removeItem(STORAGE_KEY);
    setActive(false);
    // Restore native geolocation on page reload
    window.location.reload();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Fake GPS (dev)"
        className={`flex items-center justify-center w-9 h-9 rounded-xl shadow text-xs font-bold transition-colors ${
          active ? 'bg-purple-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
        }`}
      >
        {active ? '📍' : '🔧'}
      </button>

      {open && (
        <div className="absolute top-11 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-56 z-[600] space-y-3">
          <p className="text-xs font-semibold text-purple-600">Fake GPS (dev only)</p>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 bg-purple-500 text-white rounded-lg py-1.5 text-xs font-medium"
            >
              Áp dụng
            </button>
            {active && (
              <button
                onClick={handleClear}
                className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-1.5 text-xs font-medium"
              >
                Xóa
              </button>
            )}
          </div>
          {active && (
            <p className="text-[10px] text-purple-500 text-center">Fake GPS đang bật</p>
          )}
        </div>
      )}
    </div>
  );
}
