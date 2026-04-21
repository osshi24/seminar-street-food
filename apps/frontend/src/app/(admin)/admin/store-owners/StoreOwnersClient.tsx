'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import ApprovalModal from '../../../../components/admin/store-owners/ApprovalModal';
import RejectionModal from '../../../../components/admin/store-owners/RejectionModal';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import StoreOwnerEmptyState from '../../../../components/admin/store-owners/StoreOwnerEmptyState';
import StoreOwnerFilterBar from '../../../../components/admin/store-owners/StoreOwnerFilterBar';
import StoreOwnerPagination from '../../../../components/admin/store-owners/StoreOwnerPagination';
import StoreOwnerStatsCard from '../../../../components/admin/store-owners/StoreOwnerStatsCard';
import StoreOwnerTable from '../../../../components/admin/store-owners/StoreOwnerTable';
import { Button } from '../../../../components/ui/button';
import { approveStoreOwner, listStoreOwners, rejectStoreOwner } from '../../../../lib/api/store-owners';
import type { StoreOwner, StoreOwnerStatus } from '../../../../types/store-owner';

export default function StoreOwnersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [quickActionModal, setQuickActionModal] = useState<{
    type: 'approve' | 'reject' | null;
    ownerId?: string;
    ownerName?: string;
  }>({ type: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const currentStatus = (searchParams.get('status') || 'all') as StoreOwnerStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const stats = {
    total,
    pending: storeOwners.filter((o) => o.status === 'pending').length,
    active: storeOwners.filter((o) => o.status === 'active').length,
    inactive: storeOwners.filter((o) => o.status === 'inactive').length,
    rejected: storeOwners.filter((o) => o.status === 'rejected').length,
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      if (key !== 'page') params.set('page', '1');
      router.push(`/admin/store-owners?${params.toString()}`);
    },
    [router, searchParams],
  );

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
  }, [currentPage, currentSearch, currentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleQuickAction = (action: 'approve' | 'reject', ownerId: string) => {
    const owner = storeOwners.find((item) => item.id === ownerId);
    if (!owner) return;
    setQuickActionModal({ type: action, ownerId, ownerName: owner.fullName });
  };

  const handleApprove = async () => {
    if (!quickActionModal.ownerId) return;
    setActionLoading(true);
    try {
      await approveStoreOwner(quickActionModal.ownerId);
      setQuickActionModal({ type: null });
      showToast('Đã phê duyệt tài khoản chủ gian hàng.', 'success');
      await load();
    } catch {
      showToast('Không thể phê duyệt tài khoản này.', 'error');
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
      showToast('Đã từ chối hồ sơ đăng ký.', 'success');
      await load();
    } catch {
      showToast('Không thể từ chối hồ sơ này.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const visibleStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const visibleEnd = Math.min(currentPage * limit, total);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        badge="Tài khoản"
        title="Quản lý chủ gian hàng"
        description="Duyệt hồ sơ đăng ký, theo dõi trạng thái và xử lý các trường hợp cần can thiệp."
        meta={
          total > 0
            ? `Hiển thị ${visibleStart}–${visibleEnd} trên tổng ${total} tài khoản`
            : 'Chưa có hồ sơ đăng ký nào'
        }
        action={
          <Button asChild>
            <Link href="/admin/store-drafts">
              Mở bản nháp
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <StoreOwnerStatsCard {...stats} />

      <StoreOwnerFilterBar
        currentStatus={currentStatus}
        currentSearch={currentSearch}
        onStatusChange={(status) => setParam('status', status === 'all' ? '' : status)}
        onSearchChange={(search) => setParam('search', search)}
      />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-14 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-600" />
          <p className="mt-3 text-sm text-slate-500">Đang tải danh sách...</p>
        </div>
      ) : storeOwners.length === 0 ? (
        <StoreOwnerEmptyState status={currentStatus} searchQuery={currentSearch} />
      ) : (
        <>
          <StoreOwnerTable owners={storeOwners} onQuickAction={handleQuickAction} />
          <StoreOwnerPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(page) => setParam('page', String(page))}
          />
        </>
      )}

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

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
