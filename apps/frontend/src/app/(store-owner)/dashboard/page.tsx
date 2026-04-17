'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../../lib/auth/session';
import StatGrid, { type StatItem } from '../../../components/dashboard/StatGrid';
import { getMyStore } from '../../../lib/api/stores';
import { getActiveQr, type CreateQrResponse } from '../../../lib/api/qr';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

function parseToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<{
    id: string;
    status: 'active' | 'inactive' | string;
    avgRating?: number;
    reviewCount?: number;
    menuItems?: unknown[];
    hasPendingDraft?: boolean;
  } | null>(null);
  const [activeQr, setActiveQr] = useState<CreateQrResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

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

    setIsLoading(true);
    setLoadError(null);

    getMyStore()
      .then(async (res) => {
        const s = (res?.data ?? res) as {
          id: string;
          status: 'active' | 'inactive' | string;
          avgRating?: number;
          reviewCount?: number;
          menuItems?: unknown[];
          hasPendingDraft?: boolean;
        };
        setStore(s);
        setLastUpdatedAt(new Date());

        if (s?.id) {
          try {
            const qr = await getActiveQr(s.id);
            setActiveQr(qr);
          } catch {
            setActiveQr(null);
          }
        } else {
          setActiveQr(null);
        }
      })
      .catch((err) => {
        setStore(null);
        setActiveQr(null);
        setLoadError((err as Error).message ?? 'Không thể tải dữ liệu dashboard.');
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  const menuCount = store?.menuItems?.length ?? null;
  const avgRating =
    typeof store?.avgRating === 'number'
      ? store.avgRating
      : typeof (store as { avgRating?: unknown } | null)?.avgRating === 'string'
        ? Number((store as { avgRating?: string }).avgRating)
        : null;
  const reviewCount =
    typeof store?.reviewCount === 'number'
      ? store.reviewCount
      : typeof (store as { reviewCount?: unknown } | null)?.reviewCount === 'string'
        ? Number((store as { reviewCount?: string }).reviewCount)
        : null;

  const statusLabel =
    store?.status === 'active'
      ? 'Đang hoạt động'
      : store?.status === 'inactive'
        ? 'Chưa kích hoạt'
        : store?.status
          ? String(store.status)
          : null;

  const stats: StatItem[] = [
    {
      label: 'Món trong menu',
      value: isLoading ? '…' : menuCount ?? '—',
      icon: '🍽️',
      tone: 'blue',
      helperText: 'Cập nhật menu để khách dễ chọn món.',
    },
    {
      label: 'Điểm đánh giá',
      value: isLoading ? '…' : avgRating !== null ? avgRating.toFixed(1) : '—',
      icon: '⭐',
      tone: 'amber',
      helperText: 'Duy trì chất lượng để tăng lượt quay lại.',
    },
    {
      label: 'Tổng đánh giá',
      value: isLoading ? '…' : reviewCount ?? '—',
      icon: '💬',
      tone: 'purple',
      helperText: 'Xem phản hồi mới nhất ở mục Bình luận.',
    },
    {
      label: 'Trạng thái gian hàng',
      value: isLoading ? '…' : statusLabel ?? '—',
      icon: store?.status === 'active' ? '✅' : '⏳',
      tone: 'emerald',
      helperText:
        isLoading
          ? 'Đang tải...'
          : store?.hasPendingDraft
            ? 'Bạn đang có bản nháp chờ Admin duyệt.'
            : store?.status === 'inactive'
              ? 'Gian hàng cần được Admin kích hoạt.'
              : 'Không có bản nháp chờ duyệt.',
    },
    {
      label: 'QR Code',
      value: isLoading ? '…' : activeQr ? 'Đã tạo' : 'Chưa tạo',
      icon: '🔳',
      tone: 'rose',
      helperText: isLoading ? (
        'Đang tải...'
      ) : activeQr ? (
        <span className="break-words">
          Tạo lúc {new Date(activeQr.createdAt).toLocaleString('vi-VN')}.{' '}
          <Link href="/dashboard/qr" className="font-medium text-rose-700 hover:underline">
            Quản lý QR
          </Link>
        </span>
      ) : (
        <span>
          <Link href="/dashboard/qr" className="font-medium text-rose-700 hover:underline">
            Tạo QR code
          </Link>{' '}
          để khách quét nhanh.
        </span>
      ),
    },
    {
      label: 'Tài khoản',
      value: 'Store owner',
      icon: '👤',
      tone: 'neutral',
      helperText: accountId ? `ID: ${accountId}` : '—',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Thống kê nhanh để bạn theo dõi tình trạng gian hàng.
          {lastUpdatedAt && (
            <span className="ml-1">
              Cập nhật lúc {lastUpdatedAt.toLocaleTimeString('vi-VN')}.
            </span>
          )}
        </p>
        {loadError && <p className="mt-2 text-sm text-red-600">{loadError}</p>}
      </div>

      <StatGrid stats={stats} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Truy cập nhanh</h2>
            <p className="mt-1 text-sm text-gray-500">Đi thẳng tới các tác vụ thường dùng.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/store"
            className="group rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-800">
                <span className="text-lg leading-none">🏪</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900">
                  Thông tin gian hàng
                </div>
                <div className="text-xs text-gray-500">Cập nhật mô tả, liên hệ, hình ảnh…</div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/store/menu"
            className="group rounded-xl border border-gray-200 p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
                <span className="text-lg leading-none">🧾</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-900">
                  Menu món ăn
                </div>
                <div className="text-xs text-gray-500">Thêm/sửa món, giá, mô tả…</div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/location"
            className="group rounded-xl border border-gray-200 p-4 hover:border-amber-200 hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <span className="text-lg leading-none">📍</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-amber-900">
                  Vị trí
                </div>
                <div className="text-xs text-gray-500">Ghim toạ độ, cập nhật vị trí bán…</div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/reviews"
            className="group rounded-xl border border-gray-200 p-4 hover:border-purple-200 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-800">
                <span className="text-lg leading-none">🗣️</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-900">
                  Bình luận
                </div>
                <div className="text-xs text-gray-500">Xem đánh giá, báo cáo vi phạm…</div>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/qr"
            className="group rounded-xl border border-gray-200 p-4 hover:border-rose-200 hover:bg-rose-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-800">
                <span className="text-lg leading-none">🔳</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 group-hover:text-rose-900">
                  QR Code
                </div>
                <div className="text-xs text-gray-500">Tải QR để khách quét nhanh…</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
