'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listPins, AdminLocationPin } from '../../../../lib/api/admin-location';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  superseded: 'bg-gray-100 text-gray-600',
};

export default function AdminLocationPinsPage() {
  const [pins, setPins] = useState<AdminLocationPin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPins({ status: statusFilter || undefined, page, limit: 20 })
      .then((res) => {
        setPins(res.data);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý ghim vị trí</h1>
        <Link
          href="/admin/boundaries"
          className="text-sm text-orange-600 hover:underline"
        >
          Cấu hình ranh giới →
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Bị từ chối</option>
          <option value="superseded">Đã thay thế</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Đang tải...</div>
      ) : pins.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Không có ghim vị trí nào</div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gian hàng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tọa độ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày gửi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pins.map((pin) => (
                  <tr key={pin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium">{pin.store?.name ?? pin.storeId.slice(0, 8)}</span>
                      {pin.hasDuplicateWarning && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Trùng tọa độ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pin.status] ?? ''}`}>
                        {STATUS_LABELS[pin.status] ?? pin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(pin.submittedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/location-pins/${pin.id}`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center gap-2 justify-end text-sm">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-gray-500">Trang {page} / {Math.ceil(total / 20) || 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}
