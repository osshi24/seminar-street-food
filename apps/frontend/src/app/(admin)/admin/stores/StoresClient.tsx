'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DeleteStoreConfirmDialog from '../../../../components/admin/DeleteStoreConfirmDialog';
import {
  activateStore,
  deactivateStore,
  listAdminStores,
  type AdminStoreListItem,
  type AdminStoreStatus,
} from '../../../../lib/api/admin-stores';
import StoreStatusBadge from '../../../../components/admin/stores/StoreStatusBadge';
import StatsHeader from '../../../../components/admin/stores/StatsHeader';
import PaginationControls from '../../../../components/admin/stores/PaginationControls';
import StoreTableSkeleton from '../../../../components/admin/stores/StoreTableSkeleton';
import EmptyState from '../../../../components/admin/stores/EmptyState';
import ActionsMenu from '../../../../components/admin/stores/ActionsMenu';

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  active: '🟢 Đang hoạt động',
  inactive: '🔴 Vô hiệu hóa',
};

export default function StoresClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; store?: AdminStoreListItem }>({ open: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const currentStatus = (searchParams.get('status') || 'all') as AdminStoreStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const activeCount = items.filter((s) => s.status === 'active').length;
  const inactiveCount = items.filter((s) => s.status === 'inactive').length;

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

  const handleStatusToggle = async (store: AdminStoreListItem) => {
    setActionLoading(store.id);
    try {
      if (store.status === 'active') {
        await deactivateStore(store.id);
      } else {
        await activateStore(store.id);
      }
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const timer = setTimeout(() => {
      setParam('search', value);
    }, 400);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setParam('search', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-8 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">📦 Quản Lý Gian Hàng</h1>
          <p className="mt-1 text-sm text-gray-600">Kiểm soát và quản lý tất cả gian hàng trên hệ thống</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        {!loading && (
          <StatsHeader total={total} activeCount={activeCount} inactiveCount={inactiveCount} />
        )}

        {/* Filters */}
        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => setParam('status', status === 'all' ? '' : status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  currentStatus === status || (status === 'all' && currentStatus === 'all')
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              value={searchInput}
              placeholder="Tìm kiếm theo tên gian hàng, email, hoặc tên chủ..."
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <StoreTableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon="🏪"
            title={currentSearch || currentStatus !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có gian hàng'}
            description={
              currentSearch || currentStatus !== 'all'
                ? 'Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm'
                : 'Hãy bắt đầu thêm gian hàng mới'
            }
          />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Gian Hàng
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Chủ Gian Hàng
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Trạng Thái
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Ngày Tạo
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Hành Động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((store) => (
                      <tr
                        key={store.id}
                        className="transition-colors hover:bg-blue-50/30"
                      >
                        {/* Store Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-lg font-semibold text-blue-700">
                              {store.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/admin/stores/${store.id}`}
                                className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                              >
                                {store.name}
                              </Link>
                              <div className="text-xs text-gray-500">ID: {store.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Owner */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{store.owner.fullName || '—'}</div>
                          <div className="text-xs text-gray-500">{store.owner.email || '—'}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <StoreStatusBadge status={store.status} />
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/stores/${store.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                            >
                              👁️ Chi tiết
                            </Link>
                            <ActionsMenu
                              items={[
                                {
                                  label: store.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
                                  icon: store.status === 'active' ? '🔴' : '🟢',
                                  onClick: () => handleStatusToggle(store),
                                },
                                {
                                  label: 'Xóa',
                                  icon: '🗑️',
                                  variant: 'danger',
                                  onClick: () => setDeleteDialog({ open: true, store }),
                                },
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={(page) => setParam('page', String(page))}
              />
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
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

