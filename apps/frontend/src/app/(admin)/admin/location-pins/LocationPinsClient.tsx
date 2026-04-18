'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ApprovePinModal from '../../../../components/admin/location-pins/ApprovePinModal';
import LocationPinEmptyState from '../../../../components/admin/location-pins/LocationPinEmptyState';
import LocationPinFilterBar from '../../../../components/admin/location-pins/LocationPinFilterBar';
import LocationPinPagination from '../../../../components/admin/location-pins/LocationPinPagination';
import LocationPinStatsCard from '../../../../components/admin/location-pins/LocationPinStatsCard';
import LocationPinTable from '../../../../components/admin/location-pins/LocationPinTable';
import RejectPinModal from '../../../../components/admin/location-pins/RejectPinModal';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import {
  approvePin,
  listPins,
  rejectPin,
  type AdminLocationPin,
} from '../../../../lib/api/admin-location';

export default function LocationPinsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pins, setPins] = useState<AdminLocationPin[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    superseded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const statusFilter = (searchParams.get('status') || '').toLowerCase();
  const searchQuery = searchParams.get('search') || '';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') {
        params.set('page', '1');
      }
      router.push(`/admin/location-pins?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response = await listPins({
        status: statusFilter || undefined,
        page: currentPage,
        limit,
      });

      setPins(response.data || []);

      const statsResponse = await listPins({ limit: 1000 });
      const allPins = statsResponse.data || [];
      setStats({
        total: statsResponse.total || 0,
        pending: allPins.filter((pin) => pin.status === 'pending').length,
        approved: allPins.filter((pin) => pin.status === 'approved').length,
        rejected: allPins.filter((pin) => pin.status === 'rejected').length,
        superseded: allPins.filter((pin) => pin.status === 'superseded').length,
      });
    } catch (error) {
      console.error('Error fetching location pins:', error);
      showToast('Lỗi khi tải dữ liệu ghim vị trí.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visiblePins = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) {
      return pins;
    }

    return pins.filter((pin) =>
      [pin.store?.name, pin.id, String(pin.latitude), String(pin.longitude)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [pins, searchQuery]);

  const selectedPin = pins.find((pin) => pin.id === approvingId || pin.id === rejectingId);
  const totalPages = searchQuery ? 1 : Math.ceil(stats.total / limit);
  const visibleStart = stats.total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const visibleEnd = Math.min(currentPage * limit, stats.total);

  const handleQuickAction = (action: 'approve' | 'reject' | 'delete', id: string) => {
    if (action === 'delete') {
      return;
    }

    if (action === 'approve') {
      setApprovingId(id);
      setApproveModal(true);
      return;
    }

    setRejectingId(id);
    setRejectModal(true);
  };

  const handleApprove = async (overrideLat?: number, overrideLng?: number) => {
    if (!approvingId) {
      return;
    }

    try {
      setApproveLoading(true);
      const pin = pins.find((item) => item.id === approvingId);
      if (!pin) {
        return;
      }

      await approvePin(approvingId, {
        lat: overrideLat,
        lng: overrideLng,
      });

      showToast(`Đã duyệt ghim của "${pin.store?.name || 'gian hàng'}".`, 'success');
      setApproveModal(false);
      setApprovingId(null);
      await load();
    } catch (error) {
      console.error('Error approving pin:', error);
      showToast('Lỗi khi duyệt ghim vị trí.', 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) {
      return;
    }

    try {
      setRejectLoading(true);
      const pin = pins.find((item) => item.id === rejectingId);
      if (!pin) {
        return;
      }

      await rejectPin(rejectingId, { reason });

      showToast(`Đã từ chối ghim của "${pin.store?.name || 'gian hàng'}".`, 'success');
      setRejectModal(false);
      setRejectingId(null);
      await load();
    } catch (error) {
      console.error('Error rejecting pin:', error);
      showToast('Lỗi khi từ chối ghim vị trí.', 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Map ops"
        title="Quản lý ghim vị trí"
        description="Theo dõi các đề xuất ghim mới, xác nhận tọa độ hợp lệ và chuyển nhanh sang màn chi tiết khi cần so khớp với dữ liệu hiện có."
        meta={
          searchQuery
            ? `Đang lọc cục bộ ${visiblePins.length} ghim trên trang hiện tại`
            : stats.total > 0
              ? `Hiển thị ${visibleStart}-${visibleEnd} trên tổng ${stats.total} ghim`
              : 'Chưa có đề xuất ghim nào trong hệ thống'
        }
        action={
          <Link
            href="/admin/boundaries"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Mở ranh giới
            <span aria-hidden>→</span>
          </Link>
        }
      />

      <LocationPinStatsCard
        total={stats.total}
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        superseded={stats.superseded}
      />

      <LocationPinFilterBar
        currentStatus={statusFilter}
        currentSearch={searchQuery}
        onStatusChange={(status) => setParam('status', status)}
        onSearchChange={(search) => setParam('search', search)}
      />

      {loading ? (
        <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
          <p className="mt-4 text-sm text-slate-500">Đang tải danh sách ghim vị trí...</p>
        </div>
      ) : visiblePins.length === 0 ? (
        <LocationPinEmptyState status={statusFilter} searchQuery={searchQuery} />
      ) : (
        <>
          <LocationPinTable pins={visiblePins} onQuickAction={handleQuickAction} />

          {!searchQuery && totalPages > 1 ? (
            <LocationPinPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={stats.total}
              limit={limit}
              onPageChange={(page) => setParam('page', String(page))}
            />
          ) : null}
        </>
      )}

      {selectedPin ? (
        <>
          <ApprovePinModal
            isOpen={approveModal}
            isLoading={approveLoading}
            onApprove={handleApprove}
            onCancel={() => {
              setApproveModal(false);
              setApprovingId(null);
            }}
            currentLat={selectedPin.latitude}
            currentLng={selectedPin.longitude}
            storeName={selectedPin.store?.name || 'Ghim vị trí'}
          />
          <RejectPinModal
            isOpen={rejectModal}
            isLoading={rejectLoading}
            onReject={handleReject}
            onCancel={() => {
              setRejectModal(false);
              setRejectingId(null);
            }}
            storeName={selectedPin.store?.name || 'Ghim vị trí'}
          />
        </>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
