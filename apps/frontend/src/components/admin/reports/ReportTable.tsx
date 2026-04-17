'use client';

import Link from 'next/link';
import { AdminReport } from '../../../lib/api/reports';

interface ReportTableProps {
  reports: AdminReport[];
  onQuickAction?: (action: 'resolve' | 'dismiss', id: string) => void;
}

const STATUS_COLORS: Record<string, { badge: string; border: string }> = {
  pending: {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-l-4 border-l-amber-500',
  },
  resolved: {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-l-4 border-l-emerald-500',
  },
  dismissed: {
    badge: 'bg-purple-100 text-purple-800',
    border: 'border-l-4 border-l-purple-500',
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  dismissed: 'Bác bỏ',
};

export default function ReportTable({ reports, onQuickAction }: ReportTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Gian hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Khách hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Bình luận
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Lý do
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ngày báo cáo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report) => {
            const statusColor = STATUS_COLORS[report.status];
            const stars = report.review?.stars || 0;
            return (
              <tr key={report.id} className={`${statusColor.border} hover:bg-gray-50 transition-colors`}>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {report.review?.store?.name || 'Không xác định'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600">
                    {report.review?.customer?.displayName || 'Ẩn danh'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs">
                    <div className="mb-1 flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < stars ? 'text-amber-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {report.review?.content || '(không có nội dung)'}
                    </p>
                    {report.review?.isHidden && (
                      <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Đã ẩn
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {report.reason?.labelVi || 'Không xác định'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor.badge}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onQuickAction?.('resolve', report.id)}
                          className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                        >
                          Xử lý
                        </button>
                        <button
                          onClick={() => onQuickAction?.('dismiss', report.id)}
                          className="text-xs px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
                        >
                          Bác bỏ
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
