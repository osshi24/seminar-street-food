'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '../../../../lib/api/client';
import TagFormDialog from './TagFormDialog';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_LABELS: Record<GroupType, string> = {
  dish_type: 'Loại món ăn',
  flavor: 'Khẩu vị',
  allergen: 'Dị ứng thực phẩm',
};

interface TagRow {
  id: number;
  nameVi: string;
  nameEn: string;
  groupType: GroupType;
  usageCount: number;
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; tag?: TagRow }>({ open: false });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState('');
  const [groupType, setGroupType] = useState<GroupType | ''>('');
  const [inUse, setInUse] = useState<'all' | 'in_use' | 'not_in_use'>('all');
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
    if (groupType) params.set('groupType', groupType);
    if (inUse === 'in_use') params.set('inUse', 'true');
    if (inUse === 'not_in_use') params.set('inUse', 'false');
    return params;
  }, [page, limit, debouncedKeyword, groupType, inUse]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: { data: TagRow[]; meta: ListMeta } | TagRow[] }>('/admin/tags', {
        params: Object.fromEntries(queryParams.entries()),
      });
      const payload = res.data.data;
      if (Array.isArray(payload)) {
        // Backward-compatible: if API returns an array (legacy)
        setTags(payload);
        setMeta({ page, limit, total: payload.length, totalPages: 1 });
      } else {
        setTags(payload?.data ?? []);
        setMeta(payload?.meta ?? { page, limit, total: 0, totalPages: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [queryParams, page, limit]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (tag: TagRow) => {
    setDeleteError(null);
    if (!confirm(`Xóa nhãn "${tag.nameVi}"?`)) return;
    try {
      await apiClient.delete(`/admin/tags/${tag.id}`);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(e.response?.data?.message ?? 'Không thể xóa nhãn này.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý nhãn sở thích</h1>
        <button
          onClick={() => setDialog({ open: true })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Thêm nhãn mới
        </button>
      </div>

      <div className="mb-4 rounded-lg border bg-white p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              value={keyword}
              onChange={(e) => { setPage(1); setKeyword(e.target.value); }}
              placeholder="Tìm theo tên VI/EN..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={groupType}
              onChange={(e) => { setPage(1); setGroupType(e.target.value as GroupType | ''); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Tất cả nhóm</option>
              {(Object.entries(GROUP_LABELS) as [GroupType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select
              value={inUse}
              onChange={(e) => { setPage(1); setInUse(e.target.value as 'all' | 'in_use' | 'not_in_use'); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="in_use">Đang dùng</option>
              <option value="not_in_use">Chưa dùng</option>
            </select>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Tổng: <span className="font-medium text-gray-700">{meta.total}</span> nhãn
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
          {[1,2,3].map(i => <div key={i} className="h-12 rounded bg-gray-100" />)}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên VI</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên EN</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nhóm</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Đang dùng</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{tag.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{tag.nameVi}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tag.nameEn}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{GROUP_LABELS[tag.groupType]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tag.usageCount > 0 ? (
                      <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                        {tag.usageCount} món
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDialog({ open: true, tag })}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
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
          {tags.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">Chưa có nhãn nào.</p>
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
                disabled={loading || tags.length === 0 || (meta.totalPages > 0 && meta.page >= meta.totalPages)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog.open && (
        <TagFormDialog
          initial={dialog.tag}
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
