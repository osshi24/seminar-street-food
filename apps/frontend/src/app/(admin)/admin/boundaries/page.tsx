'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boundary, deleteBoundaryById, listBoundaries, updateBoundaryById } from '../../../../lib/api/admin-location';

const BoundariesOverviewMap = dynamic(() => import('./BoundariesOverviewMap'), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full animate-pulse rounded-lg bg-gray-100" />,
});

export default function AdminBoundariesPage() {
  const [rows, setRows] = useState<Boundary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBoundaries();
      setRows(data);
    } catch {
      showToast('error', 'Không tải được danh sách ranh giới');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'active') return rows.filter((r) => r.isActive);
    if (filter === 'inactive') return rows.filter((r) => !r.isActive);
    return rows;
  }, [rows, filter]);

  const handleToggle = async (b: Boundary) => {
    try {
      await updateBoundaryById(b.id, { isActive: !b.isActive });
      showToast('success', b.isActive ? 'Đã tắt ranh giới' : 'Đã bật ranh giới');
      await load();
    } catch {
      showToast('error', 'Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = async (b: Boundary) => {
    if (!confirm(`Xóa ranh giới "${b.name}"?`)) return;
    try {
      await deleteBoundaryById(b.id);
      showToast('success', 'Đã xóa ranh giới');
      await load();
    } catch {
      showToast('error', 'Xóa thất bại');
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Quản lý ranh giới</h1>
          <p className="mt-1 text-sm text-gray-500">
            Nhiều ranh giới có thể cùng bật và đều có hiệu lực.
          </p>
        </div>
        <Link
          href="/admin/boundaries/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Tạo ranh giới
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Danh sách
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`rounded-md px-3 py-1.5 text-sm ${viewMode === 'map' ? 'bg-slate-800 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Bản đồ
          </button>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang bật</option>
          <option value="inactive">Đang tắt</option>
        </select>
        <button
          onClick={() => void load()}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Tải lại
        </button>
      </div>

      {viewMode === 'map' && (
        <div className="mb-6 rounded-lg border bg-white p-3">
          <p className="mb-2 text-xs text-gray-500">
            Mỗi màu là một ranh giới. Ranh giới tắt vẫn hiển thị (ghi chú trong tooltip).
          </p>
          <BoundariesOverviewMap boundaries={filtered} height={520} />
        </div>
      )}

      {viewMode === 'list' && (
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Số điểm</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{b.polygonCoordinates?.length ?? 0}</td>
                <td className="px-4 py-3 text-sm">
                  {b.isActive ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                      Bật
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      Tắt
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href={`/admin/boundaries/${b.id}/view`} className="text-sm text-slate-700 hover:underline">
                      Xem chi tiết
                    </Link>
                    <Link href={`/admin/boundaries/${b.id}`} className="text-sm text-blue-600 hover:underline">
                      Sửa
                    </Link>
                    <button onClick={() => void handleToggle(b)} className="text-sm text-orange-600 hover:underline">
                      {b.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => void handleDelete(b)} className="text-sm text-red-500 hover:underline">
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">Chưa có ranh giới nào.</p>
        )}
      </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
