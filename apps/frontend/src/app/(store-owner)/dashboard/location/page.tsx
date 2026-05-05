'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import CoordinateForm from './components/CoordinateForm';
import {
  getAllStoresLocation,
  submitLocation,
  revokePending,
  getActiveBoundary,
  LocationPin,
  StoreLocationSummary,
} from '../../../../lib/api/location';
import { getPublicPins, type PublicPin } from '../../../../lib/api/map';

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
  const [stores, setStores] = useState<StoreLocationSummary[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [boundary, setBoundary] = useState<{ lat: number; lng: number }[] | null>(null);
  const [allPublicPins, setAllPublicPins] = useState<PublicPin[]>([]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const applyCoords = (pin: LocationPin | null) => {
    if (pin) {
      setLat(String(pin.latitude));
      setLng(String(pin.longitude));
    } else {
      setLat('');
      setLng('');
    }
  };

  const selectStore = useCallback(
    (storeId: string, storeList: StoreLocationSummary[]) => {
      setSelectedStoreId(storeId);
      const store = storeList.find((s) => s.storeId === storeId);
      applyCoords(store?.approved ?? null);
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [storesData, boundaryData, publicPinsData] = await Promise.all([
        getAllStoresLocation(),
        getActiveBoundary().catch(() => null),
        getPublicPins().then((r) => r.pins).catch(() => []),
      ]);
      setStores(storesData);
      if (boundaryData) setBoundary(boundaryData.polygonCoordinates);
      setAllPublicPins(publicPinsData);

      if (storesData.length > 0) {
        const firstId = storesData[0].storeId;
        selectStore(firstId, storesData);
      }
    } catch {
      showToast('error', 'Không thể tải thông tin vị trí');
    } finally {
      setLoading(false);
    }
  }, [selectStore]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSelectStore = (storeId: string) => {
    selectStore(storeId, stores);
  };

  const handleCoordChange = (newLat: number, newLng: number) => {
    setLat(String(newLat));
    setLng(String(newLng));
  };

  const handleSubmit = async () => {
    if (!selectedStoreId) return;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      showToast('error', 'Vui lòng nhập tọa độ hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      const pin = await submitLocation(selectedStoreId, latNum, lngNum);
      setStores((prev) =>
        prev.map((s) => (s.storeId === selectedStoreId ? { ...s, pending: pin } : s)),
      );
      showToast('success', 'Đã gửi vị trí để duyệt');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string } } };
      const code = e.response?.data?.code;
      if (code === 'PENDING_EXISTS') {
        showToast('error', 'Gian hàng này đã có vị trí đang chờ duyệt');
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
    if (!selectedStoreId) return;
    if (!confirm('Bạn có chắc muốn thu hồi vị trí đang chờ duyệt?')) return;
    try {
      await revokePending(selectedStoreId);
      setStores((prev) =>
        prev.map((s) => (s.storeId === selectedStoreId ? { ...s, pending: null } : s)),
      );
      showToast('success', 'Đã thu hồi vị trí');
    } catch {
      showToast('error', 'Thu hồi thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-80 flex-shrink-0 p-6 border-r border-gray-100 space-y-4">
          <div className="h-7 bg-gray-200 animate-pulse rounded w-40" />
          <div className="h-4 bg-gray-100 animate-pulse rounded w-56" />
          <div className="flex gap-2 pt-2">
            {[1, 2].map((i) => <div key={i} className="h-9 w-28 bg-gray-200 animate-pulse rounded-lg" />)}
          </div>
          <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
          <div className="h-24 bg-gray-100 animate-pulse rounded-xl" />
        </div>
        <div className="flex-1 bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vị trí gian hàng</h1>
        <p className="text-gray-500 text-sm">Bạn chưa có gian hàng nào. Hãy tạo gian hàng trước.</p>
      </div>
    );
  }

  const selectedStore = stores.find((s) => s.storeId === selectedStoreId) ?? null;
  const approved = selectedStore?.approved ?? null;
  const pending = selectedStore?.pending ?? null;

  // Owner's own OTHER stores (not currently selected) — show approved or pending pin
  const ownOtherPins = stores
    .filter((s) => s.storeId !== selectedStoreId)
    .flatMap((s) => {
      const pin = s.approved ?? s.pending;
      if (!pin) return [];
      const publicMatch = allPublicPins.find((p) => p.storeId === s.storeId);
      return [{
        storeId: s.storeId,
        storeName: s.storeName,
        thumbnailUrl: publicMatch?.thumbnailUrl ?? null,
        lat: Number(pin.latitude),
        lng: Number(pin.longitude),
        isPending: !s.approved,
      }];
    });

  // Other owners' approved stores (exclude all own stores to avoid duplicate markers)
  const ownStoreIds = new Set(stores.map((s) => s.storeId));
  const otherOwnerPins = allPublicPins
    .filter((p) => !ownStoreIds.has(p.storeId))
    .map((p) => ({
      storeId: p.storeId,
      storeName: p.storeName,
      thumbnailUrl: p.thumbnailUrl,
      lat: p.latitude,
      lng: p.longitude,
      isPending: false,
    }));

  const otherPins = [...ownOtherPins, ...otherOwnerPins];

  const markerCoord =
    lat && lng
      ? { lat: parseFloat(lat), lng: parseFloat(lng) }
      : approved
      ? { lat: Number(approved.latitude), lng: Number(approved.longitude) }
      : null;

  // main layout has p-6 (24px) and a 64px header → available = 100vh - 64 - 48 = calc(100vh - 112px)
  const panelH = 'calc(100vh - 112px)';

  return (
    <div className="-m-6 flex">
      {/* ── Left panel: controls ── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col border-r border-gray-100 overflow-y-auto bg-white"
        style={{ height: panelH }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Vị trí gian hàng</h1>
          <p className="text-gray-400 text-xs mt-1">
            Kéo ghim hoặc nhập tọa độ rồi gửi duyệt.
          </p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-5 flex-1">
          {/* Store selector */}
          {stores.length > 1 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chọn gian hàng</p>
              <div className="flex flex-col gap-1.5">
                {stores.map((store) => {
                  const isSelected = store.storeId === selectedStoreId;
                  const hasPending = !!store.pending;
                  const hasApproved = !!store.approved;
                  return (
                    <button
                      key={store.storeId}
                      onClick={() => handleSelectStore(store.storeId)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                        isSelected
                          ? 'bg-orange-50 text-orange-700 border-orange-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600'
                      }`}
                    >
                      <span className="truncate">{store.storeName}</span>
                      <span className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {hasPending && (
                          <span title="Đang chờ duyệt" className="w-2 h-2 rounded-full bg-yellow-400" />
                        )}
                        {!hasPending && hasApproved && (
                          <span title="Đã có vị trí" className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                        {!hasPending && !hasApproved && (
                          <span title="Chưa có vị trí" className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trạng thái vị trí</p>
            <div className={`rounded-xl border p-3.5 ${approved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Đã duyệt</p>
              {approved ? (
                <>
                  <p className="text-sm font-semibold text-green-700">{STATUS_LABELS[approved.status]}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    {Number(approved.latitude).toFixed(6)}, {Number(approved.longitude).toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Chưa có</p>
              )}
            </div>
            <div className={`rounded-xl border p-3.5 ${pending ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Đang chờ duyệt</p>
              {pending ? (
                <>
                  <p className="text-sm font-semibold text-yellow-700">{STATUS_LABELS[pending.status]}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    {Number(pending.latitude).toFixed(6)}, {Number(pending.longitude).toFixed(6)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">Không có</p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tọa độ</p>
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
          <div className="flex flex-col gap-2 mt-auto pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !!pending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl transition text-sm"
            >
              {submitting ? 'Đang gửi...' : 'Gửi duyệt vị trí'}
            </button>
            {pending && (
              <button
                onClick={handleRevoke}
                className="w-full border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 px-4 rounded-xl transition text-sm"
              >
                Thu hồi vị trí đang chờ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel: map ── */}
      <div className="flex-1 min-w-0" style={{ height: panelH }}>
        <LocationMapPicker
          key={selectedStoreId ?? 'default'}
          initialMarker={markerCoord}
          boundary={boundary}
          otherPins={otherPins}
          height={panelH}
          onCoordinateChange={handleCoordChange}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white text-sm z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
