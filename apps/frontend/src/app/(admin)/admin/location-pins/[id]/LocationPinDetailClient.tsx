'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  getPinDetail,
  approvePin,
  rejectPin,
  deletePin,
  getBoundary,
  listPins,
  AdminLocationPin,
  NearbyPin,
  Boundary,
} from '@/lib/api/admin-location';
import LocationPinNearbyPins from '@/components/admin/location-pins/LocationPinNearbyPins';
import ApprovePinModal from '@/components/admin/location-pins/ApprovePinModal';
import RejectPinModal from '@/components/admin/location-pins/RejectPinModal';
import DeletePinModal from '@/components/admin/location-pins/DeletePinModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="min-h-[480px] animate-pulse bg-slate-100" />,
});

const STATUS_VARIANT = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  superseded: 'info',
} as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

interface LocationPinDetailClientProps {
  id: string;
}

export default function LocationPinDetailClient({ id }: LocationPinDetailClientProps) {
  const router = useRouter();
  const [pin, setPin] = useState<AdminLocationPin | null>(null);
  const [currentApproved, setCurrentApproved] = useState<AdminLocationPin | null>(null);
  const [nearbyPins, setNearbyPins] = useState<NearbyPin[]>([]);
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [allApprovedPins, setAllApprovedPins] = useState<AdminLocationPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [response, boundaryData, allApprovedData] = await Promise.all([
        getPinDetail(id),
        getBoundary(),
        listPins({ status: 'approved', limit: 1000 }),
      ]);
        setPin(response.pin);
        setCurrentApproved(response.currentApproved);
        setNearbyPins(response.duplicateWarnings || []);
        setBoundary(boundaryData);
        setAllApprovedPins(allApprovedData.data || []);
      } catch (error) {
        console.error('Error loading pin:', error);
        showToast('Lỗi khi tải chi tiết ghim', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleApprove = async (overrideLat?: number, overrideLng?: number) => {
    if (!pin) return;
    try {
      setApproveLoading(true);
      await approvePin(id, { lat: overrideLat, lng: overrideLng });
      showToast(`Đã duyệt ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
      setTimeout(() => router.push('/admin/location-pins'), 1500);
    } catch (error) {
      console.error('Error approving pin:', error);
      showToast('Lỗi khi duyệt ghim', 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!pin) return;
    try {
      setRejectLoading(true);
      await rejectPin(id, { reason });
      showToast(`Đã từ chối ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
      setTimeout(() => router.push('/admin/location-pins'), 1500);
    } catch (error) {
      console.error('Error rejecting pin:', error);
      showToast('Lỗi khi từ chối ghim', 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!pin) return;
    try {
      setDeleteLoading(true);
      await deletePin(id);
      showToast('Đã xóa ghim vị trí', 'success');
      setTimeout(() => router.push('/admin/location-pins'), 1500);
    } catch (error) {
      console.error('Error deleting pin:', error);
      showToast('Lỗi khi xóa ghim', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div className="min-h-[480px] animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-3">
            <div className="h-48 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MapPin className="mb-3 h-10 w-10 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-700">Không tìm thấy ghim vị trí</h2>
        <p className="mt-1 text-sm text-slate-500">Ghim này có thể đã bị xóa hoặc không còn tồn tại.</p>
        <Button variant="outline" className="mt-5" onClick={() => router.push('/admin/location-pins')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const isPending = pin.status === 'pending';

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách ghim vị trí
      </button>

      {/* Main layout: Map left, Sidebar right */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        {/* LEFT — Map */}
        <Card className="overflow-hidden">
          <MiniMap
            lat={Number(pin.latitude)}
            lng={Number(pin.longitude)}
            boundary={boundary?.polygonCoordinates}
            otherPins={allApprovedPins
              .filter((p) => p.id !== currentApproved?.id)
              .map((p) => ({ lat: Number(p.latitude), lng: Number(p.longitude), storeName: p.store?.name || p.storeId.slice(0, 8) }))}
            approvedPin={currentApproved ? { lat: Number(currentApproved.latitude), lng: Number(currentApproved.longitude) } : undefined}
          />
        </Card>

        {/* RIGHT — Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Store info */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Gian hàng
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold text-slate-900 leading-tight">
                    {pin.store?.name || pin.storeId.slice(0, 8)}
                  </h2>
                </div>
                <Badge variant={STATUS_VARIANT[pin.status]}>{STATUS_LABEL[pin.status]}</Badge>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 rounded-md bg-slate-50 px-3 py-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Tọa độ</p>
                    <code className="text-sm font-medium text-slate-900">
                      {Number(pin.latitude).toFixed(5)},&nbsp;{Number(pin.longitude).toFixed(5)}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-md bg-slate-50 px-3 py-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Ngày gửi</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(pin.submittedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nearby pins warning */}
          {nearbyPins.length > 0 ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">
                    {nearbyPins.length} ghim lân cận
                  </p>
                </div>
                <div className="space-y-1.5">
                  {nearbyPins.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-amber-700">
                      <span className="truncate">{p.storeName}</span>
                      <span className="ml-2 shrink-0 font-medium">
                        {p.distanceMeters < 1000
                          ? `${Math.round(p.distanceMeters)}m`
                          : `${(p.distanceMeters / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                  ))}
                  {nearbyPins.length > 3 ? (
                    <p className="text-xs text-amber-600">+{nearbyPins.length - 3} ghim khác...</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Current approved pin */}
          {currentApproved ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                  Ghim đã duyệt hiện tại
                </p>
                <code className="font-mono text-sm font-medium text-blue-900">
                  {Number(currentApproved.latitude).toFixed(6)}, {Number(currentApproved.longitude).toFixed(6)}
                </code>
              </CardContent>
            </Card>
          ) : null}

          {/* Actions */}
          {isPending ? (
            <Card>
              <CardContent className="space-y-2.5 p-4">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowApproveModal(true)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Duyệt ghim
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                  onClick={() => setShowRejectModal(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Danger zone */}
          <div className="rounded-lg border border-dashed border-slate-200 p-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Vùng nguy hiểm
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 text-sm text-rose-600 transition-colors hover:text-rose-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa ghim vĩnh viễn
            </button>
          </div>
        </div>
      </div>

      {/* Full-width nearby pins list (detailed) */}
      {nearbyPins.length > 0 ? (
        <LocationPinNearbyPins pins={nearbyPins} currentPinId={id} />
      ) : null}

      <ApprovePinModal
        isOpen={showApproveModal}
        isLoading={approveLoading}
        onApprove={handleApprove}
        onCancel={() => setShowApproveModal(false)}
        currentLat={Number(pin.latitude)}
        currentLng={Number(pin.longitude)}
        storeName={pin.store?.name || 'Ghim vị trí'}
      />

      <RejectPinModal
        isOpen={showRejectModal}
        isLoading={rejectLoading}
        onReject={handleReject}
        onCancel={() => setShowRejectModal(false)}
        storeName={pin.store?.name || 'Ghim vị trí'}
      />

      <DeletePinModal
        isOpen={showDeleteModal}
        isLoading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        storeName={pin.store?.name || 'Ghim vị trí'}
      />
    </div>
  );
}
