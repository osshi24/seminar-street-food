'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Power, Store as StoreIcon, Trash2 } from 'lucide-react';
import DeleteStoreConfirmDialog from '../../../../components/admin/DeleteStoreConfirmDialog';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import AdminToolbar from '../../../../components/admin/common/AdminToolbar';
import AdminActionsMenu from '../../../../components/admin/common/AdminActionsMenu';
import AdminEmptyState from '../../../../components/admin/common/AdminEmptyState';
import AdminPagination from '../../../../components/admin/common/AdminPagination';
import StatsHeader from '../../../../components/admin/stores/StatsHeader';
import StoreStatusBadge from '../../../../components/admin/stores/StoreStatusBadge';
import StoreTableSkeleton from '../../../../components/admin/stores/StoreTableSkeleton';
import { Button } from '../../../../components/ui/button';
import {
  activateStore,
  deactivateStore,
  listAdminStores,
  type AdminStoreListItem,
  type AdminStoreStatus,
} from '../../../../lib/api/admin-stores';

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Tạm ẩn' },
];

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
    if (searchInput === currentSearch) return;
    const timer = window.setTimeout(() => setParam('search', searchInput), 300);
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
    <div className="space-y-5">
      <AdminPageHeader
        badge="Catalog"
        title="Quản lý gian hàng"
        description="Theo dõi trạng thái vận hành và xử lý nhanh các tác vụ kích hoạt hoặc tạm ẩn."
        meta={
          total > 0
            ? `Hiển thị ${visibleStart}–${visibleEnd} trên tổng ${total} gian hàng`
            : 'Chưa có gian hàng nào trong danh mục'
        }
        action={
          <Button asChild>
            <Link href="/admin/store-drafts">
              Bản nháp chờ duyệt
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {!loading ? (
        <StatsHeader total={total} activeCount={activeCount} inactiveCount={inactiveCount} />
      ) : null}

      <AdminToolbar
        filters={STATUS_FILTERS}
        activeFilter={currentStatus}
        onFilterChange={(v) => setParam('status', v === 'all' ? '' : v)}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm theo tên, email hoặc chủ gian hàng..."
      />

      {loading ? (
        <StoreTableSkeleton />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={StoreIcon}
          title={
            currentSearch || currentStatus !== 'all'
              ? 'Không tìm thấy kết quả'
              : 'Chưa có gian hàng'
          }
          description={
            currentSearch || currentStatus !== 'all'
              ? 'Thử nới bộ lọc hoặc đổi từ khóa tìm kiếm.'
              : 'Danh mục hiện chưa có gian hàng nào để quản lý.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Gian hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Chủ gian hàng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Ngày tạo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                      Tác vụ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((store) => (
                    <tr key={store.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/stores/${store.id}`}
                              className="text-sm font-medium text-slate-900 transition-colors hover:text-cyan-700"
                            >
                              {store.name}
                            </Link>
                            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                              {store.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-900">
                          {store.owner.fullName || 'Chưa có tên'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">{store.owner.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <StoreStatusBadge status={store.status} />
                          {store.deletionRequestedAt && (
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Yêu cầu xóa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(store.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/stores/${store.id}`}>Chi tiết</Link>
                          </Button>
                          <AdminActionsMenu
                            items={[
                              {
                                label:
                                  actionLoading === store.id
                                    ? 'Đang xử lý...'
                                    : store.status === 'active'
                                      ? 'Vô hiệu hóa'
                                      : 'Kích hoạt',
                                icon: <Power />,
                                disabled: actionLoading === store.id,
                                onClick: () => void handleStatusToggle(store),
                              },
                              {
                                label: 'Xóa',
                                icon: <Trash2 />,
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
            <AdminPagination
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
