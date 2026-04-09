'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { listStoreOwners } from '../../../../lib/api/store-owners';
import type { StoreOwner, StoreOwnerStatus } from '../../../../types/store-owner';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function StoreOwnersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentStatus = (searchParams.get('status') || 'all') as StoreOwnerStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStoreOwners({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit,
      });
      setStoreOwners(result.data.data);
      setTotal(result.data.total);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentSearch, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/store-owners?${params.toString()}`);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-800">Quản lý Store Owner</h1>
        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setParam('status', status === 'all' ? '' : status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                currentStatus === status || (status === 'all' && currentStatus === 'all')
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Tìm kiếm theo tên, email, tên gian hàng..."
            className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            onChange={(e) => {
              const value = e.target.value;
              setTimeout(() => setParam('search', value), 300);
            }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Đang tải...</p>
        ) : storeOwners.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Không tìm thấy kết quả</p>
        ) : (
          <div className="rounded-md border bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gian hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng ký</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {storeOwners.map((so) => (
                  <tr key={so.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{so.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{so.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{so.store?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[so.status]}`}>
                        {STATUS_LABELS[so.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(so.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/store-owners/${so.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setParam('page', String(page))}
              className={`rounded px-3 py-1.5 text-sm ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
