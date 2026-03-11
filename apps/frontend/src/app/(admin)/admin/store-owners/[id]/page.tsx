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
import DeactivateWarningModal from '../../../../../components/auth/DeactivateWarningModal';
import type { StoreOwner } from '../../../../../types/store-owner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

export default function StoreOwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      const result = await approveStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      showToast('Đã phê duyệt tài khoản thành công');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (rejectReason.trim().length < 10) {
      setRejectError('Lý do phải có ít nhất 10 ký tự');
      return;
    }
    setActionLoading(true);
    try {
      const result = await rejectStoreOwner(id, rejectReason.trim());
      setStoreOwner(result.data as StoreOwner);
      setShowRejectModal(false);
      setRejectReason('');
      showToast('Đã từ chối tài khoản');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate(confirmed = false) {
    setActionLoading(true);
    try {
      const result = await deactivateStoreOwner(id, confirmed);
      const data = result.data as { hasPendingContent?: boolean } | StoreOwner;
      if ('hasPendingContent' in data && data.hasPendingContent) {
        setShowDeactivateWarning(true);
      } else {
        setStoreOwner(data as StoreOwner);
        setShowDeactivateWarning(false);
        showToast('Đã vô hiệu hóa tài khoản');
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const result = await reactivateStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      showToast('Đã kích hoạt lại tài khoản');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12">Đang tải...</div>;
  if (!storeOwner) return <div className="p-6 text-red-600">Không tìm thấy tài khoản</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-green-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}

      {showDeactivateWarning && (
        <DeactivateWarningModal
          onConfirm={() => handleDeactivate(true)}
          onCancel={() => setShowDeactivateWarning(false)}
          isLoading={actionLoading}
        />
      )}

      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/store-owners')}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Quay lại danh sách
          </button>
          <h1 className="text-xl font-bold">Chi tiết Store Owner</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{storeOwner.fullName}</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {STATUS_LABELS[storeOwner.status]}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{storeOwner.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Điện thoại</dt>
              <dd className="font-medium">{storeOwner.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Tên gian hàng</dt>
              <dd className="font-medium">{storeOwner.store?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ngày đăng ký</dt>
              <dd className="font-medium">
                {new Date(storeOwner.createdAt).toLocaleDateString('vi-VN')}
              </dd>
            </div>
            {storeOwner.registrationReason && (
              <div className="col-span-2">
                <dt className="text-gray-500">Lý do đăng ký</dt>
                <dd className="mt-1 text-gray-800">{storeOwner.registrationReason}</dd>
              </div>
            )}
          </dl>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            {storeOwner.status === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Phê duyệt
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Từ chối
                </button>
              </>
            )}
            {storeOwner.status === 'active' && (
              <button
                onClick={() => handleDeactivate(false)}
                disabled={actionLoading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Vô hiệu hóa
              </button>
            )}
            {storeOwner.status === 'inactive' && (
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Kích hoạt lại
              </button>
            )}
          </div>
        </div>

        {/* Reject modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Từ chối tài khoản</h3>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectError(null); }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  placeholder="Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)..."
                />
                {rejectError && <p className="mt-1 text-xs text-red-600">{rejectError}</p>}
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); setRejectError(null); }}
                  className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
