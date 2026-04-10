'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DeleteStoreConfirmDialog from '../../../../components/admin/DeleteStoreConfirmDialog';
import {
  activateStore,
  deactivateStore,
  listAdminStores,
  type AdminStoreListItem,
  type AdminStoreStatus,
} from '../../../../lib/api/admin-stores';

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

export default function StoresClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; store?: AdminStoreListItem }>({ open: false });

  const currentStatus = (searchParams.get('status') || 'all') as AdminStoreStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/stores?${params.toString()}`);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminStores({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit,
      });
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentSearch, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (store: AdminStoreListItem) => {
    if (store.status === 'active') await deactivateStore(store.id);
    else await activateStore(store.id);
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <h1 className="mb-6 text-xl font-bold text-gray-800">Quản lý gian hàng</h1>

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

      <div className="mb-4">
        <input
          type="text"
          defaultValue={currentSearch}
          placeholder="Tìm theo tên gian hàng / email chủ / tên chủ..."
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          onChange={(e) => {
            const value = e.target.value;
            setTimeout(() => setParam('search', value), 300);
          }}
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-500">Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-gray-500">Không tìm thấy kết quả</p>
      ) : (
        <div className="overflow-hidden rounded-md border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Gian hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Chủ gian hàng</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.owner.fullName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.owner.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => toggleStatus(s)} className="text-sm text-blue-600 hover:underline">
                        {s.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, store: s })}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setParam('page', String(p))}
              className={`rounded px-3 py-1.5 text-sm ${
                p === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {deleteDialog.open && deleteDialog.store && (
        <DeleteStoreConfirmDialog
          storeId={deleteDialog.store.id}
          storeName={deleteDialog.store.name}
          onClose={() => setDeleteDialog({ open: false })}
          onDeleted={() => {
            setDeleteDialog({ open: false });
            load();
          }}
        />
      )}
    </div>
  );
}

