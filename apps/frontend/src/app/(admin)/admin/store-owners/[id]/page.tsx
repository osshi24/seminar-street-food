'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getStoreOwner,
  approveStoreOwner,
  rejectStoreOwner,
  deactivateStoreOwner,
  reactivateStoreOwner,
} from '../../../../../lib/api/store-owners';
import StoreOwnerDetailHeader from '../../../../../components/admin/store-owners/StoreOwnerDetailHeader';
import StoreOwnerInfoSection from '../../../../../components/admin/store-owners/StoreOwnerInfoSection';
import StoreOwnerTimeline from '../../../../../components/admin/store-owners/StoreOwnerTimeline';
import ApprovalModal from '../../../../../components/admin/store-owners/ApprovalModal';
import RejectionModal from '../../../../../components/admin/store-owners/RejectionModal';
import DeactivateModal from '../../../../../components/admin/store-owners/DeactivateModal';
import type { StoreOwner } from '../../../../../types/store-owner';
import type { TimelineEvent } from '../../../../../components/admin/store-owners/StoreOwnerTimeline';

export default function StoreOwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [modals, setModals] = useState({
    approval: false,
    rejection: false,
    deactivate: false,
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadStoreOwner();
  }, [id]);

  async function loadStoreOwner() {
    setLoading(true);
    try {
      const result = await getStoreOwner(id);
      setStoreOwner(result.data);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      const result = await approveStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      setModals({ ...modals, approval: false });
      showToast('✓ Đã phê duyệt tài khoản thành công', 'success');
    } catch (error) {
      showToast('Lỗi khi phê duyệt tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      const result = await rejectStoreOwner(id, rejectReason.trim());
      setStoreOwner(result.data as StoreOwner);
      setModals({ ...modals, rejection: false });
      setRejectReason('');
      showToast('✓ Đã từ chối tài khoản', 'success');
    } catch (error) {
      showToast('Lỗi khi từ chối tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate() {
    setActionLoading(true);
    try {
      const result = await deactivateStoreOwner(id, true);
      const data = result.data as StoreOwner;
      setStoreOwner(data);
      setModals({ ...modals, deactivate: false });
      showToast('✓ Đã vô hiệu hóa tài khoản', 'success');
    } catch (error) {
      showToast('Lỗi khi vô hiệu hóa tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const result = await reactivateStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      showToast('✓ Đã kích hoạt lại tài khoản', 'success');
    } catch (error) {
      showToast('Lỗi khi kích hoạt lại tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!storeOwner) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-medium">❌ Không tìm thấy tài khoản</p>
      </div>
    );
  }

  const timelineEvents: TimelineEvent[] = [
    {
      icon: '📝',
      label: 'Đã đăng ký',
      description: 'Yêu cầu tạo tài khoản được gửi',
      timestamp: storeOwner.createdAt,
      color: 'blue',
    },
    ...(storeOwner.status === 'active' || storeOwner.status === 'rejected'
      ? [
          {
            icon: storeOwner.status === 'active' ? '✅' : '❌',
            label: storeOwner.status === 'active' ? 'Đã phê duyệt' : 'Đã từ chối',
            description:
              storeOwner.status === 'active' ? 'Tài khoản được kích hoạt' : 'Yêu cầu bị từ chối',
            timestamp: storeOwner.updatedAt,
            color: (storeOwner.status === 'active' ? 'green' : 'red') as 'green' | 'red',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <StoreOwnerDetailHeader
        owner={storeOwner}
        onBack={() => router.push('/admin/store-owners')}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {storeOwner.status === 'pending' && (
          <>
            <button
              onClick={() => setModals({ ...modals, approval: true })}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              ✓ Phê duyệt
            </button>
            <button
              onClick={() => setModals({ ...modals, rejection: true })}
              disabled={actionLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              ✕ Từ chối
            </button>
          </>
        )}
        {storeOwner.status === 'active' && (
          <button
            onClick={() => setModals({ ...modals, deactivate: true })}
            disabled={actionLoading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
          >
            ⛔ Vô hiệu hóa
          </button>
        )}
        {storeOwner.status === 'inactive' && (
          <button
            onClick={handleReactivate}
            disabled={actionLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            🔄 Kích hoạt lại
          </button>
        )}
      </div>

      {/* Personal Information */}
      <StoreOwnerInfoSection title="Thông tin cá nhân" icon="👤">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Họ và tên
            </label>
            <p className="mt-1 text-gray-900">{storeOwner.fullName}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Email
            </label>
            <p className="mt-1 text-gray-900">{storeOwner.email}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Số điện thoại
            </label>
            <p className="mt-1 text-gray-900">{storeOwner.phone || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
              Trạng thái
            </label>
            <div className="mt-1">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  storeOwner.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : storeOwner.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : storeOwner.status === 'inactive'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-red-100 text-red-800'
                }`}
              >
                {storeOwner.status === 'pending'
                  ? '⏳ Chờ duyệt'
                  : storeOwner.status === 'active'
                    ? '✅ Đang hoạt động'
                    : storeOwner.status === 'inactive'
                      ? '⛔ Vô hiệu hóa'
                      : '❌ Đã từ chối'}
              </span>
            </div>
          </div>
        </div>
      </StoreOwnerInfoSection>

      {/* Store Information */}
      {storeOwner.store && (
        <StoreOwnerInfoSection title="Thông tin gian hàng" icon="🏪">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Tên gian hàng
              </label>
              <p className="mt-1 text-gray-900">{storeOwner.store.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Địa chỉ
              </label>
              <p className="mt-1 text-gray-900">{storeOwner.store.address || '—'}</p>
            </div>
            <div className="col-span-2">
              <a
                href={`/admin/stores/${storeOwner.store.id}`}
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                → Xem chi tiết gian hàng
              </a>
            </div>
          </div>
        </StoreOwnerInfoSection>
      )}

      {/* Registration Details */}
      <StoreOwnerInfoSection title="Thông tin đăng ký" icon="📋">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
              Ngày đăng ký
            </label>
            <p className="text-gray-900">
              {new Date(storeOwner.createdAt).toLocaleDateString('vi-VN')} lúc{' '}
              {new Date(storeOwner.createdAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>
          {storeOwner.registrationReason && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">
                Lý do đăng ký
              </label>
              <p className="text-blue-900">{storeOwner.registrationReason}</p>
            </div>
          )}
        </div>
      </StoreOwnerInfoSection>

      {/* Timeline */}
      <StoreOwnerTimeline events={timelineEvents} />

      {/* Modals */}
      <ApprovalModal
        isOpen={modals.approval}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        onApprove={handleApprove}
        onCancel={() => setModals({ ...modals, approval: false })}
      />

      <RejectionModal
        isOpen={modals.rejection}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        onReject={handleReject}
        onCancel={() => {
          setModals({ ...modals, rejection: false });
          setRejectReason('');
        }}
      />

      <DeactivateModal
        isOpen={modals.deactivate}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        storeName={storeOwner.store?.name}
        onConfirm={handleDeactivate}
        onCancel={() => setModals({ ...modals, deactivate: false })}
      />
    </div>
  );
}
