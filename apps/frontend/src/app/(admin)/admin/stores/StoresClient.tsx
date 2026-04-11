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
import Link from 'next/link';
import Image from 'next/image';

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  active: {
    bg: 'border-green-200 bg-green-50',
    text: 'text-green-900',
    badge: 'bg-green-500',
  },
  inactive: {
    bg: 'border-slate-200 bg-slate-50',
    text: 'text-slate-900',
    badge: 'bg-slate-400',
  },
};

const SORT_OPTIONS = [
  { value: 'createdAt|desc', label: 'Mới nhất' },
  { value: 'createdAt|asc', label: 'Cũ nhất' },
  { value: 'name|asc', label: 'A → Z' },
  { value: 'name|desc', label: 'Z → A' },
];

export default function StoresClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; store?: AdminStoreListItem }>({ open: false });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const currentStatus = (searchParams.get('status') || 'all') as AdminStoreStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentSort = searchParams.get('sort') || 'createdAt|desc';
  const currentDateFrom = searchParams.get('dateFrom') || '';
  const currentDateTo = searchParams.get('dateTo') || '';
  const limit = 20;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/stores?${params.toString()}`);
  }

  function clearAllFilters() {
    router.push('/admin/stores');
  }

  const hasActiveFilters = currentSearch || currentStatus !== 'all' || currentDateFrom || currentDateTo || currentSort !== 'createdAt|desc';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = currentSort.split('|') as [string, 'asc' | 'desc'];
      const res = await listAdminStores({
        status: currentStatus !== 'all' ? currentStatus : undefined,
        search: currentSearch || undefined,
        page: currentPage,
        limit,
        sortBy: (sortBy || 'createdAt') as any,
        sortOrder: sortOrder || 'desc',
        createdFrom: currentDateFrom || undefined,
        createdTo: currentDateTo || undefined,
      });
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [currentStatus, currentSearch, currentPage, currentSort, currentDateFrom, currentDateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (store: AdminStoreListItem) => {
    if (store.status === 'active') await deactivateStore(store.id);
    else await activateStore(store.id);
    await load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Quản lý gian hàng</h1>
          <p className="mt-2 text-sm text-slate-600">Quản lý danh sách gian hàng, kích hoạt/vô hiệu hóa, xem chi tiết</p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4 bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              defaultValue={currentSearch}
              placeholder="🔍 Tìm theo tên gian hàng, email chủ, hoặc tên chủ..."
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onChange={(e) => {
                const value = e.target.value;
                setTimeout(() => setParam('search', value), 300);
              }}
            />
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {showAdvancedFilters ? '▼' : '▶'} Bộ lọc
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-600 self-center">Trạng thái:</span>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setParam('status', status === 'all' ? '' : status)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  currentStatus === status || (status === 'all' && currentStatus === 'all')
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Sort */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Sắp xếp:</span>
                <select
                  value={currentSort}
                  onChange={(e) => setParam('sort', e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Từ ngày:</label>
                  <input
                    type="date"
                    value={currentDateFrom}
                    onChange={(e) => setParam('dateFrom', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Đến ngày:</label>
                  <input
                    type="date"
                    value={currentDateTo}
                    onChange={(e) => setParam('dateTo', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-blue-600">{total}</span> kết quả tìm được
              </div>
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                ✕ Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="space-y-3 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-sm text-slate-600">Đang tải gian hàng...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-sm font-medium text-slate-900">Không tìm thấy gian hàng</p>
            <p className="mt-2 text-xs text-slate-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            {/* Store Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((store) => (
                <div
                  key={store.id}
                  className={`group overflow-hidden rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${STATUS_COLORS[store.status].bg}`}
                >
                  {/* Image Container */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-200">
                    {store.thumbnailUrl ? (
                      <>
                        <Image
                          src={store.thumbnailUrl}
                          alt={store.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400">
                        <svg
                          className="h-12 w-12 text-slate-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${STATUS_COLORS[store.status].badge}`}>
                      {STATUS_LABELS[store.status]}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col bg-white p-4">
                    {/* Store Name & Owner */}
                    <h3 className="line-clamp-2 font-semibold text-slate-900 text-sm mb-1">
                      {store.name}
                    </h3>
                    <p className="text-xs text-slate-600 mb-3">
                      <span className="font-medium">Chủ:</span> {store.owner.fullName || '—'}
                    </p>

                    {/* Email */}
                    <p className="text-xs text-slate-500 font-mono truncate mb-3">
                      {store.owner.email}
                    </p>

                    {/* Created Date */}
                    <p className="text-xs text-slate-500 mb-4">
                      📅 {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        Chi tiết
                      </Link>
                      <button
                        onClick={() => toggleStatus(store)}
                        className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                        title={store.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {store.status === 'active' ? '⊘ Off' : '✓ On'}
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, store })}
                        className="flex-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                        title="Xóa"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setParam('page', String(Math.max(1, currentPage - 1)))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setParam('page', String(pageNum))}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setParam('page', String(Math.min(totalPages, currentPage + 1)))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau →
                </button>

                <span className="ml-4 text-sm text-slate-600">
                  Trang {currentPage} / {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>

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

