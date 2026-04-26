'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, FileEdit } from 'lucide-react';
import apiClient from '@/lib/api/client';
import AdminMetricGrid from '@/components/admin/common/AdminMetricGrid';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AdminEmptyState from '@/components/admin/common/AdminEmptyState';
import { Button } from '@/components/ui/button';

interface DraftItem {
  id: string;
  store: { name: string; owner?: { fullName?: string } };
  submittedAt: string;
  status: string;
}

export default function StoreDraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/admin/store-drafts')
      .then((res) => setDrafts(res.data?.data?.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        badge="Hàng chờ"
        title="Bản nháp gian hàng chờ duyệt"
        description="Đối chiếu nội dung trước khi publish. Ưu tiên kiểm tra bản nháp mới để giảm thời gian phản hồi."
        meta={`${drafts.length} bản nháp đang chờ`}
      />

      <AdminMetricGrid
        items={[
          {
            label: 'Tổng bản nháp',
            value: drafts.length,
            tone: 'rose',
            icon: <FileEdit />,
            description: 'Bản nháp đang chờ admin review.',
          },
          {
            label: 'Mới nhất',
            value: drafts[0] ? new Date(drafts[0].submittedAt).toLocaleDateString('vi-VN') : '—',
            tone: 'blue',
            icon: <Clock />,
            description: 'Ngày gửi của bản nháp đầu hàng chờ.',
          },
        ]}
      />

      {loading ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-md bg-slate-50" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <AdminEmptyState
          icon={CheckCircle2}
          title="Không có bản nháp nào đang chờ"
          description="Hàng chờ đang trống. Khi store owner gửi cập nhật mới, bản nháp sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  {['Gian hàng', 'Chủ gian hàng', 'Ngày gửi', 'Tác vụ'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                        i === 3 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{draft.store?.name}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                        {draft.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {draft.store?.owner?.fullName || 'Chưa có thông tin'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(draft.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button asChild size="sm">
                          <Link href={`/admin/store-drafts/${draft.id}`}>Xem & duyệt</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
