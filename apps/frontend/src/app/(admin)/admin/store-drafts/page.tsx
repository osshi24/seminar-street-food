'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api/client';
import AdminMetricGrid from '@/components/admin/common/AdminMetricGrid';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

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
      .then((res) => {
        setDrafts(res.data?.data?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Review queue"
        title="Bản nháp gian hàng chờ duyệt"
        description="Đối chiếu nội dung cửa hàng trước khi publish. Ưu tiên kiểm tra các bản nháp mới để tránh làm chậm vòng phản hồi của store owner."
        meta={`${drafts.length} bản nháp đang nằm trong hàng chờ`}
      />

      <AdminMetricGrid
        items={[
          {
            label: 'Tổng bản nháp',
            value: drafts.length,
            tone: 'rose',
            icon: '📝',
            description: 'Tổng số bản nháp hiện chờ admin review nội dung.',
          },
          {
            label: 'Mới nhất',
            value: drafts[0] ? new Date(drafts[0].submittedAt).toLocaleDateString('vi-VN') : '—',
            tone: 'blue',
            icon: '🕒',
            description: 'Ngày gửi của bản nháp nằm đầu hàng chờ hiện tại.',
          },
        ]}
      />

      {loading ? (
        <div className="space-y-3 rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-50" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-50 text-2xl">✅</div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">Không có bản nháp nào đang chờ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Hàng chờ hiện đang trống. Khi store owner gửi cập nhật mới, bản nháp sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-5 py-4">Gian hàng</th>
                  <th className="px-5 py-4">Chủ gian hàng</th>
                  <th className="px-5 py-4">Ngày gửi</th>
                  <th className="px-5 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drafts.map((draft) => (
                  <tr key={draft.id} className="transition hover:bg-cyan-50/40">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{draft.store?.name}</p>
                      <p className="mt-1 text-sm text-slate-500">ID draft: {draft.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {draft.store?.owner?.fullName || 'Chưa có thông tin'}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(draft.submittedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/store-drafts/${draft.id}`}
                          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Xem và duyệt
                        </Link>
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
