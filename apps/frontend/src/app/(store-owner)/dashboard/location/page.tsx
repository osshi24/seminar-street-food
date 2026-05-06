'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Send,
  Store as StoreIcon,
  Undo2,
} from 'lucide-react';
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
import StoreOwnerPageHeader from '../../../../components/dashboard/common/StoreOwnerPageHeader';
import StoreOwnerEmptyState from '../../../../components/dashboard/common/StoreOwnerEmptyState';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { cn } from '../../../../lib/cn';

const LocationMapPicker = dynamic(
  () => import('./components/LocationMapPicker'),
  {
    ssr: false,
    loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-100" />,
  },
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
  const [revokeDialog, setRevokeDialog] = useState(false);
  const [revoking, setRevoking] = useState(false);

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
        selectStore(storesData[0].storeId, storesData);
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

  const handleSelectStore = (storeId: string) => selectStore(storeId, stores);

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
      showToast('success', 'Đã gửi vị trí để Admin duyệt');
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
    setRevoking(true);
    try {
      await revokePending(selectedStoreId);
      setStores((prev) =>
        prev.map((s) => (s.storeId === selectedStoreId ? { ...s, pending: null } : s)),
      );
      showToast('success', 'Đã thu hồi vị trí');
      setRevokeDialog(false);
    } catch {
      showToast('error', 'Thu hồi thất bại');
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="h-[500px] animate-pulse rounded-xl bg-white" />
          <div className="h-[500px] animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="space-y-5">
        <StoreOwnerPageHeader
          badge="Bản đồ"
          title="Vị trí gian hàng"
          description="Ghim toạ độ chính xác để khách dễ dàng tìm đến gian hàng của bạn."
        />
        <StoreOwnerEmptyState
          icon={MapPin}
          title="Chưa có gian hàng nào"
          description="Bạn cần tạo gian hàng trước khi có thể ghim vị trí trên bản đồ."
        />
      </div>
    );
  }

  const selectedStore = stores.find((s) => s.storeId === selectedStoreId) ?? null;
  const approved = selectedStore?.approved ?? null;
  const pending = selectedStore?.pending ?? null;

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

  const hasUnsavedChange =
    !!lat &&
    !!lng &&
    (!approved ||
      Number(approved.latitude).toFixed(6) !== Number(lat).toFixed(6) ||
      Number(approved.longitude).toFixed(6) !== Number(lng).toFixed(6));

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Bản đồ"
        title="Vị trí gian hàng"
        description="Kéo ghim trên bản đồ hoặc nhập toạ độ rồi gửi Admin duyệt."
        meta={
          stores.length > 1
            ? `Đang xem: ${selectedStore?.storeName ?? '—'}`
            : undefined
        }
      />

      {stores.length > 1 && (
        <Card>
          <CardContent className="flex flex-wrap gap-2 p-3">
            {stores.map((store) => {
              const isSelected = store.storeId === selectedStoreId;
              const dot = store.pending
                ? 'bg-amber-400'
                : store.approved
                  ? 'bg-emerald-500'
                  : 'bg-slate-300';
              return (
                <button
                  key={store.storeId}
                  onClick={() => handleSelectStore(store.storeId)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    isSelected
                      ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600',
                  )}
                >
                  <StoreIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[160px] truncate">{store.storeName}</span>
                  <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-3">
          <StatusCard
            tone="emerald"
            label="Vị trí đã duyệt"
            icon={CheckCircle2}
            pin={approved}
            emptyText="Chưa có vị trí được duyệt"
          />
          <StatusCard
            tone="amber"
            label="Đang chờ duyệt"
            icon={Clock}
            pin={pending}
            emptyText="Không có yêu cầu chờ duyệt"
            statusLabel={pending ? STATUS_LABELS[pending.status] : undefined}
          />

          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Toạ độ mới
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Có thể kéo ghim trên bản đồ hoặc nhập trực tiếp.
                </p>
              </div>
              <CoordinateForm
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !!pending || !hasUnsavedChange}
                  className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  <Send />
                  {submitting
                    ? 'Đang gửi...'
                    : pending
                      ? 'Đang chờ duyệt — không thể gửi'
                      : !hasUnsavedChange
                        ? 'Chưa có thay đổi'
                        : 'Gửi duyệt vị trí'}
                </Button>
                {pending && (
                  <Button
                    variant="outline"
                    onClick={() => setRevokeDialog(true)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Undo2 />
                    Thu hồi vị trí đang chờ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="h-[560px] w-full">
            <LocationMapPicker
              key={selectedStoreId ?? 'default'}
              initialMarker={markerCoord}
              boundary={boundary}
              otherPins={otherPins}
              height="560px"
              onCoordinateChange={handleCoordChange}
            />
          </div>
        </Card>
      </div>

      <Dialog open={revokeDialog} onOpenChange={setRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thu hồi vị trí đang chờ?</DialogTitle>
            <DialogDescription>
              Yêu cầu duyệt vị trí hiện tại sẽ bị huỷ. Bạn có thể gửi lại bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialog(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={revoking}
            >
              {revoking ? 'Đang xử lý...' : 'Thu hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600',
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

interface StatusCardProps {
  tone: 'emerald' | 'amber';
  label: string;
  icon: typeof CheckCircle2;
  pin: LocationPin | null;
  emptyText: string;
  statusLabel?: string;
}

function StatusCard({ tone, label, icon: Icon, pin, emptyText, statusLabel }: StatusCardProps) {
  const tones = {
    emerald: {
      ring: pin ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white',
      iconBg: pin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400',
      text: pin ? 'text-emerald-700' : 'text-slate-400',
    },
    amber: {
      ring: pin ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white',
      iconBg: pin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400',
      text: pin ? 'text-amber-700' : 'text-slate-400',
    },
  }[tone];

  return (
    <Card className={cn('border', tones.ring)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', tones.iconBg)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          {pin ? (
            <>
              <p className={cn('mt-0.5 text-sm font-semibold', tones.text)}>
                {statusLabel ?? STATUS_LABELS[pin.status]}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                {Number(pin.latitude).toFixed(6)}, {Number(pin.longitude).toFixed(6)}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-slate-400">{emptyText}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
