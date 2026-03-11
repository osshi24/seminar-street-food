'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '../../../../lib/api/client';

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
    apiClient.get('/admin/store-drafts').then((res) => {
      setDrafts(res.data?.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-800">Bản nháp gian hàng chờ duyệt</h1>
      {loading ? (
        <p>Đang tải...</p>
      ) : drafts.length === 0 ? (
        <p className="text-gray-500">Không có bản nháp nào đang chờ duyệt</p>
      ) : (
        <div className="rounded-md border bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gian hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drafts.map((draft) => (
                <tr key={draft.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{draft.store?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(draft.submittedAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/store-drafts/${draft.id}`} className="text-sm text-blue-600 hover:underline">
                      Xem & duyệt
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
