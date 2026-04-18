'use client';

import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import NotificationBell from '../notifications/NotificationBell';

const SECTION_LABELS: Array<[string, string]> = [
  ['/admin/store-owners', 'Chủ gian hàng'],
  ['/admin/store-drafts', 'Bản nháp'],
  ['/admin/location-pins', 'Ghim vị trí'],
  ['/admin/boundaries', 'Ranh giới'],
  ['/admin/reports', 'Báo cáo'],
  ['/admin/reviews', 'Bình luận'],
  ['/admin/tags', 'Nhãn sở thích'],
  ['/admin/announcements', 'Thông báo'],
  ['/admin/stores', 'Gian hàng'],
  ['/admin', 'Tổng quan'],
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const section =
    SECTION_LABELS.find(([prefix]) =>
      prefix === '/admin' ? pathname === prefix : pathname.startsWith(prefix),
    )?.[1] ?? 'Admin';

  const handleLogout = () => {
    Cookies.remove('admin_access_token', { path: '/' });
    router.push('/admin/login');
  };

  const nowLabel = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Không gian quản trị
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              {section}
            </h1>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {nowLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <NotificationBell role="admin" />
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m4.5-3l-3-3m3 3l-3 3m3-3H9"
              />
            </svg>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
