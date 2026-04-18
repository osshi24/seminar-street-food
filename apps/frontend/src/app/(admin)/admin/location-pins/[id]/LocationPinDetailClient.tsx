'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getPinDetail,
  approvePin,
  rejectPin,
  deletePin,
  AdminLocationPin,
  NearbyPin,
} from '@/lib/api/admin-location';
import LocationPinDetailHeader from '@/components/admin/location-pins/LocationPinDetailHeader';
import LocationPinInfoSection from '@/components/admin/location-pins/LocationPinInfoSection';
import LocationPinNearbyPins from '@/components/admin/location-pins/LocationPinNearbyPins';
import ApprovePinModal from '@/components/admin/location-pins/ApprovePinModal';
import RejectPinModal from '@/components/admin/location-pins/RejectPinModal';
import DeletePinModal from '@/components/admin/location-pins/DeletePinModal';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-[28px] bg-slate-100" />,
});

interface LocationPinDetailClientProps {
  id: string;
}

export default function LocationPinDetailClient({ id }: LocationPinDetailClientProps) {
  const router = useRouter();
  const [pin, setPin] = useState<AdminLocationPin | null>(null);
  const [currentApproved, setCurrentApproved] = useState<AdminLocationPin | null>(null);
  const [nearbyPins, setNearbyPins] = useState<NearbyPin[]>([]);
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
        const response = await getPinDetail(id);
        setPin(response.pin);
        setCurrentApproved(response.currentApproved);
        setNearbyPins(response.duplicateWarnings || []);
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
      showToast(`✓ Đã duyệt ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
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
      showToast(`✓ Đã từ chối ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
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
      showToast('✓ Đã xóa ghim vị trí', 'success');
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
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] bg-white/70" />
        <div className="h-80 animate-pulse rounded-[32px] bg-white/70" />
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          badge="Location moderation"
          title="Không tìm thấy ghim vị trí"
          description="Ghim này có thể đã bị xóa hoặc không còn tồn tại trong hệ thống."
          action={
            <button
              onClick={() => router.push('/admin/location-pins')}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Quay lại danh sách
            </button>
          }
        />
      </div>
    );
  }

  const isPending = pin.status === 'pending';

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <AdminPageHeader
        badge="Location moderation"
        title="Chi tiết ghim vị trí"
        description="Xem đối chiếu ghim vị trí, phát hiện xung đột tọa độ và xử lý đề xuất theo đúng quy trình moderation của bản đồ."
        meta={`Pin ID: ${id}`}
        action={
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại
          </button>
        }
      />

      <LocationPinDetailHeader
        storeName={pin.store?.name || pin.storeId.slice(0, 8)}
        latitude={pin.latitude}
        longitude={pin.longitude}
        status={pin.status}
        submittedAt={pin.submittedAt}
      />

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <MiniMap lat={Number(pin.latitude)} lng={Number(pin.longitude)} />
      </div>

      {nearbyPins.length > 0 ? <LocationPinNearbyPins pins={nearbyPins} currentPinId={id} /> : null}

      {currentApproved ? (
        <LocationPinInfoSection title="Ghim đã duyệt hiện tại" icon="✅">
          <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Tọa độ hiện tại</p>
            <code className="mt-2 block text-sm font-semibold text-blue-900">
              {Number(currentApproved.latitude).toFixed(6)}, {Number(currentApproved.longitude).toFixed(6)}
            </code>
          </div>
        </LocationPinInfoSection>
      ) : null}

      {isPending ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <LocationPinInfoSection title="Duyệt ghim" icon="✅">
            <p className="text-sm leading-6 text-slate-600">
              Phê duyệt ghim này để hiển thị chính thức trên bản đồ công khai.
            </p>
            <button
              onClick={() => setShowApproveModal(true)}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Duyệt
            </button>
          </LocationPinInfoSection>

          <LocationPinInfoSection title="Từ chối ghim" icon="❌">
            <p className="text-sm leading-6 text-slate-600">
              Từ chối đề xuất này và cung cấp lý do để store owner chỉnh sửa và gửi lại.
            </p>
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Từ chối
            </button>
          </LocationPinInfoSection>
        </div>
      ) : null}

      <LocationPinInfoSection title="Xóa ghim vị trí" icon="🗑️">
        <p className="text-sm leading-6 text-slate-600">
          Xóa ghim này vĩnh viễn khỏi hệ thống. Hành động này không thể hoàn tác.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Xóa
        </button>
      </LocationPinInfoSection>

      <ApprovePinModal
        isOpen={showApproveModal}
        isLoading={approveLoading}
        onApprove={handleApprove}
        onCancel={() => setShowApproveModal(false)}
        currentLat={pin.latitude}
        currentLng={pin.longitude}
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
