'use client';

import { useEffect, useState } from 'react';

type GpsState = 'checking' | 'granted' | 'prompt' | 'denied';

export default function GpsPermissionBanner() {
  const [state, setState] = useState<GpsState>('checking');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      // HTTP trên LAN → Chrome block geolocation → không thể làm gì
      setState('denied');
      return;
    }

    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setState(result.state as GpsState);
          result.addEventListener('change', () => setState(result.state as GpsState));
        })
        .catch(() => {
          // iOS Safari: permissions.query throw → hiện banner prompt, để user tự bấm
          setState('prompt');
        });
    } else {
      // Không có Permissions API → hiện banner, để user bấm "Bật" trước
      setState('prompt');
    }
  }, []);

  function handleEnable() {
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      () => { setState('granted'); setRequesting(false); },
      (err) => {
        setRequesting(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setState('denied');
        } else {
          // TIMEOUT hoặc POSITION_UNAVAILABLE → quyền đã cấp, GPS chậm lấy tín hiệu
          if (navigator.permissions) {
            navigator.permissions
              .query({ name: 'geolocation' })
              .then((r) => setState(r.state as GpsState))
              .catch(() => setState('granted'));
          } else {
            setState('granted');
          }
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
    );
  }

  if (state === 'checking' || state === 'granted') return null;

  if (state === 'denied') {
    return (
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] w-[calc(100%-2rem)] max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 px-4 py-3 flex items-start gap-3">
          <span className="text-xl mt-0.5">📍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">Không thể dùng GPS</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Truy cập qua <strong>HTTPS</strong> hoặc cho phép vị trí trong cài đặt trình duyệt.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // state === 'prompt'
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">📍</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">Bật vị trí GPS</p>
          <p className="text-xs text-gray-500 mt-0.5">Để hiển thị gian hàng gần bạn</p>
        </div>
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="shrink-0 rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white active:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {requesting ? '...' : 'Bật'}
        </button>
      </div>
    </div>
  );
}
