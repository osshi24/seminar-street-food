'use client';

import { Star } from 'lucide-react';
import { AdminReport } from '../../../lib/api/reports';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import type { BadgeProps } from '../../ui/badge';
import { cn } from '../../../lib/cn';

interface ReportTableProps {
  reports: AdminReport[];
  onQuickAction?: (action: 'resolve' | 'dismiss', id: string) => void;
}

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  dismissed: 'Bác bỏ',
};

export default function ReportTable({ reports, onQuickAction }: ReportTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              {['Nguồn báo cáo', 'Bình luận', 'Lý do', 'Trạng thái', 'Ngày', 'Tác vụ'].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                      i === 5 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reports.map((report) => {
              const stars = report.review?.stars || 0;
              return (
                <tr key={report.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium text-slate-900">
                      {report.review?.store?.name || 'Không xác định'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Người báo cáo: {report.reporter?.fullName || 'Ẩn danh'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Khách: {report.review?.customer?.displayName || 'Ẩn danh'}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="max-w-[320px]">
                      <div className="mb-1 flex gap-0.5">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              'h-3.5 w-3.5',
                              index < stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300',
                            )}
                          />
                        ))}
                      </div>
                      <p className="line-clamp-3 text-sm leading-5 text-slate-600">
                        {report.review?.content || '(không có nội dung)'}
                      </p>
                      {report.review?.isHidden ? (
                        <Badge variant="default" className="mt-2">
                          Đã ẩn
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {report.reason?.labelVi || 'Không xác định'}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={STATUS_VARIANT[report.status]}>
                      {STATUS_LABELS[report.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-slate-500">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1">
                      {report.status === 'pending' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onQuickAction?.('resolve', report.id)}
                            className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            Xử lý
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onQuickAction?.('dismiss', report.id)}
                            className="text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                          >
                            Bác bỏ
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Hoàn tất</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
