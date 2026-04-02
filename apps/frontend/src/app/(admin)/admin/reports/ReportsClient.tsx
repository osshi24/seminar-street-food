'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  listAdminReports,
  resolveReport,
  dismissReport,
  AdminReport,
} from '@/lib/api/reports';
import ReportStatsCard from '@/components/admin/reports/ReportStatsCard';
import ReportFilterBar from '@/components/admin/reports/ReportFilterBar';
import ReportTable from '@/components/admin/reports/ReportTable';
import ReportEmptyState from '@/components/admin/reports/ReportEmptyState';
import ReportPagination from '@/components/admin/reports/ReportPagination';
import ResolveReportModal from '@/components/admin/reports/ResolveReportModal';
import DismissReportModal from '@/components/admin/reports/DismissReportModal';

export default function ReportsClient() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Pagination
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  // Filters
  const statusFilter = (searchParams.get('status') || '').toLowerCase();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch filtered reports
        const response = await listAdminReports({
          status: statusFilter || undefined,
          page: currentPage,
          limit,
        });

        console.log('Reports response:', response); // Debug
        
        const reportsList = Array.isArray(response.data) ? response.data : [];
        setReports(reportsList);

        // Fetch stats (limit max 100)
        const statsResponse = await listAdminReports({ limit: 100 });
        console.log('Stats response:', statsResponse); // Debug
        
        const allReports = Array.isArray(statsResponse.data) ? statsResponse.data : [];
        setStats({
          total: statsResponse.meta?.total || 0,
          pending: allReports.filter((r) => r.status === 'pending').length,
          resolved: allReports.filter((r) => r.status === 'resolved').length,
          dismissed: allReports.filter((r) => r.status === 'dismissed').length,
        });
      } catch (error) {
        console.error('Error fetching reports:', error);
        showToast('Lỗi khi tải dữ liệu', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, currentPage]);

  // Modal states
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState(false);
  const [dismissModal, setDismissModal] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [dismissLoading, setDismissLoading] = useState(false);

  const getSelectedReport = () => {
    if (!Array.isArray(reports)) return undefined;
    return reports.find((r) => r.id === resolvingId || r.id === dismissingId);
  };

  const handleQuickAction = (action: 'resolve' | 'dismiss', id: string) => {
    if (action === 'resolve') {
      setResolvingId(id);
      setResolveModal(true);
    } else {
      setDismissingId(id);
      setDismissModal(true);
    }
  };

  const handleResolve = async (action: 'hide' | 'delete') => {
    if (!resolvingId) return;

    try {
      setResolveLoading(true);
      const report = reports.find((r) => r.id === resolvingId);
      if (!report) return;

      await resolveReport(resolvingId, action);

      const actionText = action === 'hide' ? 'Ẩn' : 'Xóa';
      showToast(`✓ ${actionText} bình luận thành công`, 'success');
      setResolveModal(false);
      setResolvingId(null);

      // Refresh data
      const response = await listAdminReports({
        status: statusFilter || undefined,
        page: currentPage,
        limit,
      });
      setReports(response.data || []);
    } catch (error) {
      console.error('Error resolving report:', error);
      showToast('Lỗi khi xử lý báo cáo', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!dismissingId) return;

    try {
      setDismissLoading(true);
      await dismissReport(dismissingId);

      showToast('✓ Đã bác bỏ báo cáo', 'success');
      setDismissModal(false);
      setDismissingId(null);

      // Refresh data
      const response = await listAdminReports({
        status: statusFilter || undefined,
        page: currentPage,
        limit,
      });
      setReports(response.data || []);
    } catch (error) {
      console.error('Error dismissing report:', error);
      showToast('Lỗi khi bác bỏ báo cáo', 'error');
    } finally {
      setDismissLoading(false);
    }
  };

  const selectedReport = getSelectedReport();
  const totalPages = Math.ceil(stats.total / limit);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý báo cáo bình luận</h1>
      </div>

      {/* Stats */}
      <ReportStatsCard
        total={stats.total}
        pending={stats.pending}
        resolved={stats.resolved}
        dismissed={stats.dismissed}
      />

      {/* Filter Bar */}
      <ReportFilterBar currentStatus={statusFilter} currentSearch={searchQuery} />

      {/* Main Content */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : reports.length === 0 ? (
        <ReportEmptyState status={statusFilter} searchQuery={searchQuery} />
      ) : (
        <>
          <ReportTable reports={reports} onQuickAction={handleQuickAction} />
          <ReportPagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={stats.total}
            limit={limit}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('page', page.toString());
              window.location.href = `/admin/reports?${params.toString()}`;
            }}
          />
        </>
      )}

      {/* Modals */}
      {selectedReport && (
        <>
          <ResolveReportModal
            isOpen={resolveModal}
            isLoading={resolveLoading}
            onResolve={handleResolve}
            onCancel={() => {
              setResolveModal(false);
              setResolvingId(null);
            }}
            storeName={selectedReport.review?.store?.name || 'Báo cáo'}
            reviewContent={selectedReport.review?.content || ''}
          />
          <DismissReportModal
            isOpen={dismissModal}
            isLoading={dismissLoading}
            onDismiss={handleDismiss}
            onCancel={() => {
              setDismissModal(false);
              setDismissingId(null);
            }}
            storeName={selectedReport.review?.store?.name || 'Báo cáo'}
          />
        </>
      )}

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
