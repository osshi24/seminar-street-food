'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import CoordinateForm from './components/CoordinateForm';
import { getMyLocation, submitLocation, revokePending, LocationPin } from '../../../../lib/api/location';
import { getBoundary } from '../../../../lib/api/admin-location';

const LocationMapPicker = dynamic(
  () => import('./components/LocationMapPicker'),
  { ssr: false, loading: () => <div className="h-[360px] bg-gray-100 animate-pulse rounded-lg" /> },
);

const STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPage() {
  const [approved, setApproved] = useState<LocationPin | null>(null);
  const [pending, setPending] = useState<LocationPin | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [boundary, setBoundary] = useState<{ lat: number; lng: number }[] | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationData, boundaryData] = await Promise.all([
        getMyLocation(),
        getBoundary().catch(() => null),
      ]);
      setApproved(locationData.approved);
      setPending(locationData.pending);
      if (boundaryData) setBoundary(boundaryData.polygonCoordinates);

      // Set form coordinates to approved pin if exists
      if (locationData.approved) {
        setLat(String(locationData.approved.latitude));
        setLng(String(locationData.approved.longitude));
      }
    } catch {
      showToast('error', 'Không thể tải thông tin vị trí');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCoordChange = (newLat: number, newLng: number) => {
    setLat(String(newLat));
    setLng(String(newLng));
  };

  const handleSubmit = async () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      showToast('error', 'Vui lòng nhập tọa độ hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const pin = await submitLocation(latNum, lngNum);
      setPending(pin);
      showToast('success', 'Đã gửi vị trí để duyệt');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string } } };
      const code = e.response?.data?.code;
      if (code === 'PENDING_EXISTS') {
        showToast('error', 'Bạn đã có một vị trí đang chờ duyệt');
      } else if (code === 'LOCATION_OUT_OF_BOUNDARY') {
        showToast('error', 'Vị trí nằm ngoài ranh giới phố ẩm thực');
      } else {
        showToast('error', 'Gửi vị trí thất bại, vui lòng thử lại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Bạn có chắc muốn thu hồi vị trí đang chờ duyệt?')) return;
    try {
      await revokePending();
      setPending(null);
      showToast('success', 'Đã thu hồi vị trí');
    } catch {
      showToast('error', 'Thu hồi thất bại');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-48 mb-4" />
        <div className="h-[360px] bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  const markerCoord =
    lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : approved
      ? { lat: Number(approved.latitude), lng: Number(approved.longitude) }
      : null;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Vị trí gian hàng</h1>
      <p className="text-gray-500 text-sm mb-6">
        Kéo thả ghim trên bản đồ hoặc nhập tọa độ để gửi duyệt vị trí gian hàng của bạn.
      </p>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-1">Vị trí đã duyệt</p>
          {approved ? (
            <>
              <p className="text-sm font-medium text-green-700">{STATUS_LABELS[approved.status]}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Number(approved.latitude).toFixed(6)}, {Number(approved.longitude).toFixed(6)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Chưa có</p>
          )}
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-1">Vị trí đang chờ</p>
          {pending ? (
            <>
              <p className="text-sm font-medium text-yellow-700">{STATUS_LABELS[pending.status]}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Number(pending.latitude).toFixed(6)}, {Number(pending.longitude).toFixed(6)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Không có</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="mb-4">
        <LocationMapPicker
          initialMarker={markerCoord}
          boundary={boundary}
          onCoordinateChange={handleCoordChange}
        />
      </div>

      {/* Coordinate form */}
      <div className="mb-4">
        <CoordinateForm
          lat={lat}
          lng={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !!pending}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {submitting ? 'Đang gửi...' : 'Gửi duyệt'}
        </button>
        {pending && (
          <button
            onClick={handleRevoke}
            className="flex-1 border border-red-400 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition"
          >
            Thu hồi vị trí đang chờ
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
