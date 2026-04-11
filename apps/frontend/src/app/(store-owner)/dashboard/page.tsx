'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../../lib/auth/session';
import { getMyStores } from '../../../lib/api/stores';
import { useActiveStore } from '../../../contexts/ActiveStoreContext';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

interface StoreOverviewItem {
  id: string;
  name: string;
  status: string;
  menuItemCount?: number;
  imageCount?: number;
  hasCommentary?: boolean;
  createdAt?: string;
}

interface OverviewStats {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  totalMenuItems: number;
  totalImages: number;
  storesWithCommentary: number;
}

function parseToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  } catch {
    return null;
  }
}

function buildOverviewStats(stores: StoreOverviewItem[]): OverviewStats {
  return stores.reduce<OverviewStats>((acc, store) => {
    const status = (store.status ?? '').toLowerCase();
    if (status === 'active') acc.activeStores += 1;
    if (status === 'inactive') acc.inactiveStores += 1;

    acc.totalStores += 1;
    acc.totalMenuItems += store.menuItemCount ?? 0;
    acc.totalImages += store.imageCount ?? 0;
    if (store.hasCommentary) acc.storesWithCommentary += 1;

    return acc;
  }, {
    totalStores: 0,
    activeStores: 0,
    inactiveStores: 0,
    totalMenuItems: 0,
    totalImages: 0,
    storesWithCommentary: 0,
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { activeStoreId } = useActiveStore();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreOverviewItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/store-owner/login');
      return;
    }

    const payload = parseToken(token);
    if (payload) {
      setAccountId(payload.sub);
    }

    let cancelled = false;

    const loadOverview = async () => {
      setLoadingOverview(true);
      setOverviewError(null);
      try {
        const result = await getMyStores();
        const list = (result.data ?? result) as StoreOverviewItem[];
        if (!cancelled) {
          setStores(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) {
          setOverviewError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
        }
      } finally {
        if (!cancelled) {
          setLoadingOverview(false);
        }
      }
    };

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const stats = buildOverviewStats(stores);
  const activeStore = stores.find((store) => store.id === activeStoreId) ?? null;

  const statCards = [
    {
      title: 'Tổng gian hàng',
      value: stats.totalStores,
      subtitle: `${stats.activeStores} hoạt động`,
    },
    {
      title: 'Chờ duyệt',
      value: stats.inactiveStores,
      subtitle: 'Đang đợi Admin kích hoạt',
    },
    {
      title: 'Tổng món ăn',
      value: stats.totalMenuItems,
      subtitle: 'Cộng trên tất cả gian hàng',
    },
    {
      title: 'Tổng hình ảnh',
      value: stats.totalImages,
      subtitle: 'Ảnh món và ảnh gian hàng',
    },
    {
      title: 'Có thuyết minh',
      value: stats.storesWithCommentary,
      subtitle: 'Gian hàng đã có audio AI',
    },
    {
      title: 'Tài khoản',
      value: accountId ?? '—',
      subtitle: 'Store owner hiện tại',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Theo dõi nhanh hiệu trạng gian hàng và nội dung của bạn.
        </p>
      </div>

      {overviewError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {overviewError}
        </div>
      )}

      {loadingOverview ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.title}</p>
              <p className="mt-2 break-all text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Gian hàng gần đây</h2>
            <button
              onClick={() => router.push('/dashboard/stores')}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Quản lý gian hàng
            </button>
          </div>

          {stores.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">Chưa có gian hàng nào.</p>
          ) : (
            <div className="space-y-2">
              {stores.slice(0, 5).map((store) => {
                const isSelected = store.id === activeStoreId;
                const isActive = (store.status ?? '').toLowerCase() === 'active';
                return (
                  <div
                    key={store.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500">
                        {(store.menuItemCount ?? 0)} món • {(store.imageCount ?? 0)} ảnh
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {isActive ? 'Hoạt động' : 'Chờ duyệt'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Gian hàng đang chọn</h2>
          {!activeStore ? (
            <p className="mt-3 text-sm text-gray-500">Chưa có gian hàng nào được chọn.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Tên:</span> {activeStore.name}</p>
              <p><span className="font-medium">Trạng thái:</span> {activeStore.status}</p>
              <p><span className="font-medium">Món ăn:</span> {activeStore.menuItemCount ?? 0}</p>
              <p><span className="font-medium">Hình ảnh:</span> {activeStore.imageCount ?? 0}</p>
              <p><span className="font-medium">Thuyết minh:</span> {activeStore.hasCommentary ? 'Có' : 'Chưa có'}</p>
            </div>
          )}
          <button
            onClick={() => router.push('/dashboard/qr')}
            className="mt-4 w-full rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
          >
            Tới trang QR code
          </button>
        </div>
      </div>
    </div>
  );
}
