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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-slate-100" />,
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
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="h-80 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="space-y-5">
        <AdminPageHeader
          badge="Bản đồ"
          title="Không tìm thấy ghim vị trí"
          description="Ghim này có thể đã bị xóa hoặc không còn tồn tại."
          action={
            <Button variant="outline" onClick={() => router.push('/admin/location-pins')}>
              Quay lại danh sách
            </Button>
          }
        />
      </div>
    );
  }

  const isPending = pin.status === 'pending';

  return (
    <div className="space-y-5">
      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <AdminPageHeader
        badge="Bản đồ"
        title="Chi tiết ghim vị trí"
        description="Đối chiếu ghim, phát hiện xung đột và xử lý đề xuất theo quy trình."
        meta={`Pin ID: ${id}`}
        action={
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
        }
      />

      <LocationPinDetailHeader
        storeName={pin.store?.name || pin.storeId.slice(0, 8)}
        latitude={pin.latitude}
        longitude={pin.longitude}
        status={pin.status}
        submittedAt={pin.submittedAt}
      />

      <Card className="overflow-hidden">
        <MiniMap lat={Number(pin.latitude)} lng={Number(pin.longitude)} />
      </Card>

      {nearbyPins.length > 0 ? <LocationPinNearbyPins pins={nearbyPins} currentPinId={id} /> : null}

      {currentApproved ? (
        <LocationPinInfoSection title="Ghim đã duyệt hiện tại">
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-blue-700">
              Tọa độ hiện tại
            </p>
            <code className="mt-1 block font-mono text-sm font-medium text-blue-900">
              {Number(currentApproved.latitude).toFixed(6)},{' '}
              {Number(currentApproved.longitude).toFixed(6)}
            </code>
          </div>
        </LocationPinInfoSection>
      ) : null}

      {isPending ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <LocationPinInfoSection title="Duyệt ghim">
            <p className="text-sm text-slate-600">
              Phê duyệt ghim này để hiển thị chính thức trên bản đồ công khai.
            </p>
            <Button
              onClick={() => setShowApproveModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Duyệt
            </Button>
          </LocationPinInfoSection>

          <LocationPinInfoSection title="Từ chối ghim">
            <p className="text-sm text-slate-600">
              Từ chối đề xuất này và cung cấp lý do để store owner chỉnh sửa.
            </p>
            <Button
              onClick={() => setShowRejectModal(true)}
              variant="outline"
              className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              Từ chối
            </Button>
          </LocationPinInfoSection>
        </div>
      ) : null}

      <LocationPinInfoSection title="Xóa ghim vị trí">
        <p className="text-sm text-slate-600">
          Xóa ghim này vĩnh viễn khỏi hệ thống. Hành động không thể hoàn tác.
        </p>
        <Button onClick={() => setShowDeleteModal(true)} variant="destructive" className="w-full">
          Xóa
        </Button>
      </LocationPinInfoSection>

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
