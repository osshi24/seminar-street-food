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
} from '../../../../../lib/api/admin-location';
import LocationPinDetailHeader from '../../../../../components/admin/location-pins/LocationPinDetailHeader';
import LocationPinInfoSection from '../../../../../components/admin/location-pins/LocationPinInfoSection';
import LocationPinNearbyPins from '../../../../../components/admin/location-pins/LocationPinNearbyPins';
import ApprovePinModal from '../../../../../components/admin/location-pins/ApprovePinModal';
import RejectPinModal from '../../../../../components/admin/location-pins/RejectPinModal';
import DeletePinModal from '../../../../../components/admin/location-pins/DeletePinModal';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
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

  // Modal states
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
        const res = await getPinDetail(id);
        setPin(res.pin);
        setCurrentApproved(res.currentApproved);
        setNearbyPins(res.duplicateWarnings || []);
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
      await approvePin(id, {
        latitude: overrideLat,
        longitude: overrideLng,
      });

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

      showToast(`✕ Đã từ chối ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
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
      <div className="space-y-6 p-6">
        <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (!pin) {
    return (
      <div className="space-y-6 p-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Quay lại
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-3xl mb-3">❌</div>
          <h3 className="text-lg font-semibold text-red-900">Không tìm thấy ghim</h3>
          <p className="text-sm text-red-700 mt-2">Ghim vị trí này không tồn tại</p>
        </div>
      </div>
    );
  }

  const isPending = pin.status === 'pending';

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Quay lại
      </button>

      {/* Header */}
      <LocationPinDetailHeader
        storeName={pin.store?.name || pin.storeId.slice(0, 8)}
        latitude={pin.latitude}
        longitude={pin.longitude}
        status={pin.status}
        submittedAt={pin.submittedAt}
        submittedBy={pin.submittedBy}
      />

      {/* Mini map */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <MiniMap lat={Number(pin.latitude)} lng={Number(pin.longitude)} />
      </div>

      {/* Nearby/Duplicate Pins */}
      {nearbyPins.length > 0 && (
        <LocationPinNearbyPins pins={nearbyPins} currentPinId={id} />
      )}

      {/* Current approved pin info */}
      {currentApproved && (
        <LocationPinInfoSection title="Ghim đã duyệt hiện tại" icon="✅">
          <div className="space-y-2">
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Tọa độ hiện tại:</p>
              <code className="text-sm text-blue-900 font-mono">
                {Number(currentApproved.latitude).toFixed(6)}, {Number(currentApproved.longitude).toFixed(6)}
              </code>
            </div>
          </div>
        </LocationPinInfoSection>
      )}

      {/* Actions */}
      {isPending && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-900">
              <span>✓</span> Duyệt ghim
            </h3>
            <p className="mb-4 text-sm text-emerald-700">
              Phê duyệt ghim vị trí này để hiển thị trên bản đồ công cộng.
            </p>
            <button
              onClick={() => setShowApproveModal(true)}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Duyệt
            </button>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-900">
              <span>✕</span> Từ chối
            </h3>
            <p className="mb-4 text-sm text-red-700">
              Từ chối ghim vị trí này với lý do chi tiết.
            </p>
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full rounded-lg border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Từ chối
            </button>
          </div>
        </div>
      )}

      {/* Delete */}
      <LocationPinInfoSection title="Xóa ghim vị trí" icon="🗑️">
        <p className="text-sm text-gray-600 mb-4">
          Xóa ghim này vĩnh viễn. Hành động này không thể hoàn tác.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Xóa
        </button>
      </LocationPinInfoSection>

      {/* Modals */}
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
