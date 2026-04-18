'use client';

import { AdminReport } from '../../../lib/api/reports';

interface ReportTableProps {
  reports: AdminReport[];
  onQuickAction?: (action: 'resolve' | 'dismiss', id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  dismissed: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  resolved: 'Đã xử lý',
  dismissed: 'Bác bỏ',
};

export default function ReportTable({ reports, onQuickAction }: ReportTableProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Nguồn báo cáo</th>
              <th className="px-5 py-4">Bình luận</th>
              <th className="px-5 py-4">Lý do</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Ngày báo cáo</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const stars = report.review?.stars || 0;

              return (
                <tr key={report.id} className="transition hover:bg-cyan-50/40">
                  <td className="px-5 py-4 align-top">
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-slate-900">
                        {report.review?.store?.name || 'Không xác định'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Người báo cáo: {report.reporter?.fullName || 'Ẩn danh'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Khách hàng: {report.review?.customer?.displayName || 'Ẩn danh'}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-[360px]">
                      <div className="mb-2 flex gap-1 text-sm">
                        {[...Array(5)].map((_, index) => (
                          <span key={index} className={index < stars ? 'text-amber-400' : 'text-slate-300'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                        {report.review?.content || '(không có nội dung)'}
                      </p>
                      {report.review?.isHidden ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          Bình luận đã bị ẩn
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-slate-600">
                    {report.reason?.labelVi || 'Không xác định'}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-slate-500">
                    {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      {report.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => onQuickAction?.('resolve', report.id)}
                            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Xử lý
                          </button>
                          <button
                            onClick={() => onQuickAction?.('dismiss', report.id)}
                            className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                          >
                            Bác bỏ
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">Đã hoàn tất</span>
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
