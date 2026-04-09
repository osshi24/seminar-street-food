'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminReportTable from '../../../../components/admin/AdminReportTable';
import apiClient from '../../../../lib/api/client';

type ReportStatus = 'pending' | 'resolved' | 'dismissed';

interface ReportRow {
  id: string;
  status: string;
  createdAt: string;
  reason: { id: number; labelVi: string } | null;
  reporter: { id: string; fullName: string } | null;
  review: {
    id: string;
    stars: number;
    content: string | null;
    isHidden: boolean;
    customer: { displayName: string } | null;
    store: { id: string; name: string } | null;
  } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/reports', {
        params: { status: activeTab, limit: 50 },
      });
      setReports(data.data);
      setTotal(data.meta.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleResolve = async (id: string, action: 'hide' | 'delete') => {
    await apiClient.patch(`/admin/reports/${id}/resolve`, { action });
    fetchReports();
  };

  const handleDismiss = async (id: string) => {
    await apiClient.patch(`/admin/reports/${id}/dismiss`);
    fetchReports();
  };

  const tabs: { label: string; value: ReportStatus }[] = [
    { label: 'Chờ xử lý', value: 'pending' },
    { label: 'Đã xử lý', value: 'resolved' },
    { label: 'Bác bỏ', value: 'dismissed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý báo cáo bình luận</h1>
        <span className="rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-700">
          {total} báo cáo
        </span>
      </div>

      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded bg-gray-100" />)}
        </div>
      ) : (
        <AdminReportTable reports={reports} onResolve={handleResolve} onDismiss={handleDismiss} />
      )}
    </div>
  );
}
