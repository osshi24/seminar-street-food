'use client';

import { useEffect, useState } from 'react';
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
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

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

  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const statusFilter = (searchParams.get('status') || '').toLowerCase();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await listAdminReports({
          status: statusFilter || undefined,
          page: currentPage,
          limit,
        });

        const reportsList = Array.isArray(response.data) ? response.data : [];
        setReports(reportsList);

        const statsResponse = await listAdminReports({ limit: 100 });
        const allReports = Array.isArray(statsResponse.data) ? statsResponse.data : [];
        setStats({
          total: statsResponse.meta?.total || 0,
          pending: allReports.filter((report) => report.status === 'pending').length,
          resolved: allReports.filter((report) => report.status === 'resolved').length,
          dismissed: allReports.filter((report) => report.status === 'dismissed').length,
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

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [resolveModal, setResolveModal] = useState(false);
  const [dismissModal, setDismissModal] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [dismissLoading, setDismissLoading] = useState(false);

  const getSelectedReport = () => {
    if (!Array.isArray(reports)) return undefined;
    return reports.find((report) => report.id === resolvingId || report.id === dismissingId);
  };

  const handleQuickAction = (action: 'resolve' | 'dismiss', id: string) => {
    if (action === 'resolve') {
      setResolvingId(id);
      setResolveModal(true);
      return;
    }

    setDismissingId(id);
    setDismissModal(true);
  };

  const reloadCurrentPage = async () => {
    const response = await listAdminReports({
      status: statusFilter || undefined,
      page: currentPage,
      limit,
    });
    setReports(response.data || []);
  };

  const handleResolve = async (action: 'hide' | 'delete') => {
    if (!resolvingId) return;

    try {
      setResolveLoading(true);
      await resolveReport(resolvingId, action);

      const actionText = action === 'hide' ? 'Ẩn' : 'Xóa';
      showToast(`✓ ${actionText} bình luận thành công`, 'success');
      setResolveModal(false);
      setResolvingId(null);
      await reloadCurrentPage();
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
      await reloadCurrentPage();
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
    <div className="space-y-5">
      <AdminPageHeader
        badge="Kiểm duyệt"
        title="Quản lý báo cáo bình luận"
        description="Theo dõi báo cáo do store owner gửi lên và xử lý nhanh các nội dung vi phạm."
        meta={`${stats.pending} báo cáo đang chờ xử lý`}
      />

      <ReportStatsCard
        total={stats.total}
        pending={stats.pending}
        resolved={stats.resolved}
        dismissed={stats.dismissed}
      />

      <ReportFilterBar currentStatus={statusFilter} currentSearch={searchQuery} />

      {loading ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-md bg-slate-50" />
          ))}
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

      {selectedReport ? (
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
      ) : null}

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
