'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../../../lib/api/client';
import CustomerFormDialog from './CustomerFormDialog';

interface CustomerRow {
  id: string;
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  reviewCount: number;
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; customer?: CustomerRow }>({ open: false });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [hasAvatar, setHasAvatar] = useState<'all' | 'yes' | 'no'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [meta, setMeta] = useState<ListMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    const k = debouncedKeyword.trim();
    if (k) params.set('keyword', k);
    if (hasAvatar === 'yes') params.set('hasAvatar', 'true');
    if (hasAvatar === 'no') params.set('hasAvatar', 'false');
    return params;
  }, [page, limit, debouncedKeyword, hasAvatar]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: { data: CustomerRow[]; meta: ListMeta } }>('/admin/customers', {
        params: Object.fromEntries(queryParams.entries()),
      });
      const payload = res.data.data;
      setRows(payload?.data ?? []);
      setMeta(payload?.meta ?? { page, limit, total: 0, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  }, [queryParams, page, limit]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (c: CustomerRow) => {
    setDeleteError(null);
    if (!confirm(`Xóa khách hàng "${c.displayName}"?`)) return;
    try {
      await apiClient.delete(`/admin/customers/${c.id}`);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(e.response?.data?.message ?? 'Không thể xóa khách hàng này.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý khách hàng</h1>
        <button
          onClick={() => setDialog({ open: true })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Thêm khách hàng
        </button>
      </div>

      <div className="mb-4 rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              value={keyword}
              onChange={(e) => { setPage(1); setKeyword(e.target.value); }}
              placeholder="Tìm theo email / tên hiển thị..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={hasAvatar}
              onChange={(e) => { setPage(1); setHasAvatar(e.target.value as 'all' | 'yes' | 'no'); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Tất cả avatar</option>
              <option value="yes">Có avatar</option>
              <option value="no">Chưa có avatar</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Tổng: <span className="font-medium text-gray-700">{meta.total}</span> khách hàng
          </span>
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value, 10)); }}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>/ trang</span>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-gray-100" />)}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Avatar</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Đánh giá</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="h-9 w-9 overflow-hidden rounded-full border bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={c.displayName}
                        src={c.avatarUrl ?? '/images/default-avatar.png'}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{c.displayName}</span>
                      <span className="text-xs text-gray-400">{c.googleId.startsWith('manual:') ? 'Manual' : 'Google'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.reviewCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDialog({ open: true, customer: c })}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">Chưa có khách hàng nào.</p>
          )}
          <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
            <div className="text-xs text-gray-600">
              Trang <span className="font-medium text-gray-800">{meta.page}</span>
              {meta.totalPages ? (
                <> / <span className="font-medium text-gray-800">{meta.totalPages}</span></>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={meta.page <= 1 || loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || rows.length === 0 || (meta.totalPages > 0 && meta.page >= meta.totalPages)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog.open && (
        <CustomerFormDialog
          initial={dialog.customer}
          onClose={() => setDialog({ open: false })}
          onSaved={() => { setDialog({ open: false }); load(); }}
        />
      )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

