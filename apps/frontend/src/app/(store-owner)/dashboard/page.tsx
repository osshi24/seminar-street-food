'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../../lib/auth/session';
import StatGrid, { type StatItem } from '../../../components/dashboard/StatGrid';

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
  }, [router]);

  const stats: StatItem[] = [
    {
      label: 'Món trong menu',
      value: 12,
      icon: '🍽️',
      tone: 'blue',
      helperText: 'Cập nhật menu để khách dễ chọn món.',
    },
    {
      label: 'Điểm đánh giá',
      value: '4.6',
      icon: '⭐',
      tone: 'amber',
      helperText: 'Duy trì chất lượng để tăng lượt quay lại.',
    },
    {
      label: 'Tổng đánh giá',
      value: 38,
      icon: '💬',
      tone: 'purple',
      helperText: 'Xem phản hồi mới nhất ở mục Bình luận.',
    },
    {
      label: 'Trạng thái gian hàng',
      value: 'Đang hoạt động',
      icon: '✅',
      tone: 'emerald',
      helperText: 'Nếu có bản nháp, hãy gửi để Admin duyệt.',
    },
    {
      label: 'Ảnh đã tải lên',
      value: 5,
      icon: '📷',
      tone: 'rose',
      helperText: 'Thêm ảnh rõ nét giúp tăng tin tưởng.',
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
          Thống kê nhanh để bạn theo dõi tình trạng gian hàng. (Dữ liệu demo)
        </p>
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
