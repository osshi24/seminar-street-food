'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  listPins,
  approvePin,
  rejectPin,
  AdminLocationPin,
} from '../../../../lib/api/admin-location';
import LocationPinStatsCard from '../../../../components/admin/location-pins/LocationPinStatsCard';
import LocationPinFilterBar from '../../../../components/admin/location-pins/LocationPinFilterBar';
import LocationPinTable from '../../../../components/admin/location-pins/LocationPinTable';
import LocationPinEmptyState from '../../../../components/admin/location-pins/LocationPinEmptyState';
import LocationPinPagination from '../../../../components/admin/location-pins/LocationPinPagination';
import ApprovePinModal from '../../../../components/admin/location-pins/ApprovePinModal';
import RejectPinModal from '../../../../components/admin/location-pins/RejectPinModal';

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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const statusFilter = (searchParams.get('status') || '').toLowerCase();
  const searchQuery = searchParams.get('search') || '';

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/location-pins?${params.toString()}`);
  };

  useEffect(() => {
    const fetchData = async () => {
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
        showToast('Lỗi khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, currentPage]);

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const getSelectedPin = () => pins.find((pin) => pin.id === approvingId || pin.id === rejectingId);

  const handleQuickAction = (action: 'approve' | 'reject' | 'delete', id: string) => {
    if (action === 'delete') return;
    if (action === 'approve') {
      setApprovingId(id);
      setApproveModal(true);
      return;
    }

    setRejectingId(id);
    setRejectModal(true);
  };

  const reloadCurrentPage = async () => {
    const response = await listPins({
      status: statusFilter || undefined,
      page: currentPage,
      limit,
    });
    setPins(response.data || []);
  };

  const handleApprove = async (overrideLat?: number, overrideLng?: number) => {
    if (!approvingId) return;

    try {
      setApproveLoading(true);
      const pin = pins.find((item) => item.id === approvingId);
      if (!pin) return;

      await approvePin(approvingId, {
        lat: overrideLat,
        lng: overrideLng,
      });

      showToast(`✓ Đã duyệt ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
      setApproveModal(false);
      setApprovingId(null);
      await reloadCurrentPage();
    } catch (error) {
      console.error('Error approving pin:', error);
      showToast('Lỗi khi duyệt ghim', 'error');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) return;

    try {
      setRejectLoading(true);
      const pin = pins.find((item) => item.id === rejectingId);
      if (!pin) return;

      await rejectPin(rejectingId, { reason });

      showToast(`✓ Đã từ chối ghim của "${pin.store?.name || 'gian hàng'}"`, 'success');
      setRejectModal(false);
      setRejectingId(null);
      await reloadCurrentPage();
    } catch (error) {
      console.error('Error rejecting pin:', error);
      showToast('Lỗi khi từ chối ghim', 'error');
    } finally {
      setRejectLoading(false);
    }
  };

  const selectedPin = getSelectedPin();
  const totalPages = Math.ceil(stats.total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ghim vị trí</h1>
      </div>

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
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : pins.length === 0 ? (
        <LocationPinEmptyState status={statusFilter} searchQuery={searchQuery} />
      ) : (
        <>
          <LocationPinTable pins={pins} onQuickAction={handleQuickAction} />
          <LocationPinPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={stats.total}
            limit={limit}
            onPageChange={(nextPage) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', nextPage.toString());
              window.location.href = `/admin/location-pins?${params.toString()}`;
            }}
          />
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
          className={`fixed bottom-6 right-6 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
