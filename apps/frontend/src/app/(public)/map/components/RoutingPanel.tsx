'use client';

import { useState } from 'react';
import { buildOSRMRouteUrl, parseOSRMResponse } from '../../../../lib/map/routing';

interface RoutingPanelProps {
  destLat: number;
  destLng: number;
  onRouteFound: (coords: [number, number][]) => void;
  onClose: () => void;
}

export default function RoutingPanel({ destLat, destLng, onRouteFound, onClose }: RoutingPanelProps) {
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRoute = async (fromLat: number, fromLng: number) => {
    setLoading(true);
    try {
      const url = buildOSRMRouteUrl(fromLat, fromLng, destLat, destLng);
      const res = await fetch(url);
      const data = await res.json() as Parameters<typeof parseOSRMResponse>[0];
      const route = parseOSRMResponse(data);
      if (route) {
        onRouteFound(route.coordinates);
      }
    } catch {
      setGpsError('Không thể lấy chỉ đường, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleGPS = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchRoute(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLoading(false);
        setGpsError('Bạn đã từ chối GPS. Vui lòng nhập tọa độ thủ công bên dưới.');
      },
      { timeout: 10000 },
    );
  };

  const handleManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      setGpsError('Tọa độ không hợp lệ');
      return;
    }
    void fetchRoute(lat, lng);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-gray-800 text-sm">Chỉ đường</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
      </div>

      <button
        onClick={handleGPS}
        disabled={loading}
        className="w-full mb-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
      >
        {loading ? 'Đang tính...' : '📍 Dùng vị trí GPS hiện tại'}
      </button>

      {gpsError && (
        <div className="mb-3">
          <p className="text-xs text-red-600 mb-2">{gpsError}</p>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Vĩ độ"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
            />
            <input
              type="number"
              step="any"
              placeholder="Kinh độ"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <button
            onClick={handleManual}
            className="mt-2 w-full border border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-medium py-1.5 rounded-lg transition"
          >
            Chỉ đường từ tọa độ này
          </button>
        </div>
      )}
    </div>
  );
}
