'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { listStoreOwners, approveStoreOwner, rejectStoreOwner } from '../../../../lib/api/store-owners';
import type { StoreOwner, StoreOwnerStatus } from '../../../../types/store-owner';
import StoreOwnerStatsCard from '../../../../components/admin/store-owners/StoreOwnerStatsCard';
import StoreOwnerFilterBar from '../../../../components/admin/store-owners/StoreOwnerFilterBar';
import StoreOwnerTable from '../../../../components/admin/store-owners/StoreOwnerTable';
import StoreOwnerEmptyState from '../../../../components/admin/store-owners/StoreOwnerEmptyState';
import StoreOwnerPagination from '../../../../components/admin/store-owners/StoreOwnerPagination';
import ApprovalModal from '../../../../components/admin/store-owners/ApprovalModal';
import RejectionModal from '../../../../components/admin/store-owners/RejectionModal';

export default function StoreOwnersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Quick action modals
  const [quickActionModal, setQuickActionModal] = useState<{
    type: 'approve' | 'reject' | null;
    ownerId?: string;
    ownerName?: string;
  }>({ type: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentStatus = (searchParams.get('status') || 'all') as StoreOwnerStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  // Calculate stats
  const stats = {
    total,
    pending: storeOwners.filter((o) => o.status === 'pending').length,
    active: storeOwners.filter((o) => o.status === 'active').length,
    inactive: storeOwners.filter((o) => o.status === 'inactive').length,
    rejected: storeOwners.filter((o) => o.status === 'rejected').length,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStoreOwners({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit,
      });
      setStoreOwners(result.data.data);
      setTotal(result.data.total);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentSearch, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/store-owners?${params.toString()}`);
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickAction = (action: 'approve' | 'reject', ownerId: string) => {
    const owner = storeOwners.find((o) => o.id === ownerId);
    if (owner) {
      setQuickActionModal({ type: action, ownerId, ownerName: owner.fullName });
    }
  };

  const handleApprove = async () => {
    if (!quickActionModal.ownerId) return;

    setActionLoading(true);
    try {
      await approveStoreOwner(quickActionModal.ownerId);
      setQuickActionModal({ type: null });
      showToast('✓ Đã phê duyệt tài khoản thành công', 'success');
      await load();
    } catch (error) {
      showToast('Lỗi khi phê duyệt tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quickActionModal.ownerId) return;

    setActionLoading(true);
    try {
      await rejectStoreOwner(quickActionModal.ownerId, rejectReason);
      setQuickActionModal({ type: null });
      setRejectReason('');
      showToast('✓ Đã từ chối tài khoản', 'success');
      await load();
    } catch (error) {
      showToast('Lỗi khi từ chối tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý chủ gian hàng</h1>
        <p className="mt-1 text-gray-600">Duyệt, quản lý và điều chỉnh tài khoản chủ gian hàng</p>
      </div>

      {/* Stats Cards */}
      <StoreOwnerStatsCard {...stats} />

      {/* Filter Bar */}
      <StoreOwnerFilterBar
        currentStatus={currentStatus}
        currentSearch={currentSearch}
        onStatusChange={(status) => setParam('status', status === 'all' ? '' : status)}
        onSearchChange={(search) => setParam('search', search)}
      />

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      )}

      {/* Table or Empty State */}
      {!loading && storeOwners.length === 0 ? (
        <StoreOwnerEmptyState status={currentStatus} searchQuery={currentSearch} />
      ) : (
        !loading && (
          <>
            <StoreOwnerTable
              owners={storeOwners}
              onQuickAction={handleQuickAction}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <StoreOwnerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={(page) => setParam('page', String(page))}
              />
            )}
          </>
        )
      )}

      {/* Quick Action Modals */}
      <ApprovalModal
        isOpen={quickActionModal.type === 'approve'}
        isLoading={actionLoading}
        storeOwnerName={quickActionModal.ownerName}
        onApprove={handleApprove}
        onCancel={() => setQuickActionModal({ type: null })}
      />

      <RejectionModal
        isOpen={quickActionModal.type === 'reject'}
        isLoading={actionLoading}
        storeOwnerName={quickActionModal.ownerName}
        onReject={handleReject}
        onCancel={() => {
          setQuickActionModal({ type: null });
          setRejectReason('');
        }}
      />
    </div>
  );
}

