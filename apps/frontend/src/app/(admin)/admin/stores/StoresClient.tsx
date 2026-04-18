'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DeleteStoreConfirmDialog from '../../../../components/admin/DeleteStoreConfirmDialog';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import ActionsMenu from '../../../../components/admin/stores/ActionsMenu';
import EmptyState from '../../../../components/admin/stores/EmptyState';
import PaginationControls from '../../../../components/admin/stores/PaginationControls';
import StatsHeader from '../../../../components/admin/stores/StatsHeader';
import StoreStatusBadge from '../../../../components/admin/stores/StoreStatusBadge';
import StoreTableSkeleton from '../../../../components/admin/stores/StoreTableSkeleton';
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
  inactive: 'Tạm ẩn',
};

const STATUS_STYLES: Record<string, string> = {
  all: 'border-slate-200 bg-slate-50 text-slate-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  inactive: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function StoresClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminStoreListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    store?: AdminStoreListItem;
  }>({ open: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const currentStatus = (searchParams.get('status') || 'all') as AdminStoreStatus | 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const activeCount = items.filter((store) => store.status === 'active').length;
  const inactiveCount = items.filter((store) => store.status === 'inactive').length;

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') {
        params.set('page', '1');
      }
      router.push(`/admin/stores?${params.toString()}`);
    },
    [router, searchParams],
  );

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
  }, [currentPage, currentSearch, currentStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchInput === currentSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      setParam('search', searchInput);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentSearch, searchInput, setParam]);

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

  const visibleStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const visibleEnd = Math.min(currentPage * limit, total);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Catalog"
        title="Quản lý gian hàng"
        description="Theo dõi trạng thái vận hành, mở chi tiết từng gian hàng và xử lý nhanh các tác vụ kích hoạt hoặc tạm ẩn từ cùng một màn hình."
        meta={
          total > 0
            ? `Hiển thị ${visibleStart}-${visibleEnd} trên tổng ${total} gian hàng`
            : 'Chưa có gian hàng nào trong danh mục'
        }
        action={
          <Link
            href="/admin/store-drafts"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Mở bản nháp chờ duyệt
            <span aria-hidden>→</span>
          </Link>
        }
      />

      {!loading ? (
        <StatsHeader total={total} activeCount={activeCount} inactiveCount={inactiveCount} />
      ) : null}

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const isActive =
                  currentStatus === status || (status === 'all' && currentStatus === 'all');

                return (
                  <button
                    key={status}
                    onClick={() => setParam('status', status === 'all' ? '' : status)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? STATUS_STYLES[status]
                        : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm leading-6 text-slate-500">
              Lọc theo trạng thái và tìm nhanh theo tên gian hàng, email hoặc tên chủ gian hàng.
            </p>
          </div>

          <div className="relative w-full xl:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchInput}
              placeholder="Tìm theo tên gian hàng, email hoặc chủ gian hàng..."
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
            />
            {searchInput ? (
              <button
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {loading ? (
        <StoreTableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🏪"
          title={currentSearch || currentStatus !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có gian hàng'}
          description={
            currentSearch || currentStatus !== 'all'
              ? 'Thử nới bộ lọc hoặc điều chỉnh từ khóa tìm kiếm để xem thêm kết quả.'
              : 'Danh mục hiện chưa có gian hàng nào để quản lý.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Gian hàng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Chủ gian hàng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Tác vụ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((store) => (
                    <tr key={store.id} className="transition hover:bg-cyan-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-100">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/stores/${store.id}`}
                              className="font-semibold text-slate-900 transition hover:text-cyan-700"
                            >
                              {store.name}
                            </Link>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                              {store.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">
                          {store.owner.fullName || 'Chưa có tên hiển thị'}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{store.owner.email || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StoreStatusBadge status={store.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/stores/${store.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                          >
                            Chi tiết
                          </Link>
                          <ActionsMenu
                            items={[
                              {
                                label:
                                  actionLoading === store.id
                                    ? 'Đang xử lý...'
                                    : store.status === 'active'
                                      ? 'Vô hiệu hóa'
                                      : 'Kích hoạt',
                                icon: store.status === 'active' ? '🔴' : '🟢',
                                onClick: () => {
                                  if (actionLoading) {
                                    return;
                                  }
                                  void handleStatusToggle(store);
                                },
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

          {totalPages > 1 ? (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={(page) => setParam('page', String(page))}
            />
          ) : null}
        </>
      )}

      {deleteDialog.open && deleteDialog.store ? (
        <DeleteStoreConfirmDialog
          storeId={deleteDialog.store.id}
          storeName={deleteDialog.store.name}
          onClose={() => setDeleteDialog({ open: false })}
          onDeleted={() => {
            setDeleteDialog({ open: false });
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
