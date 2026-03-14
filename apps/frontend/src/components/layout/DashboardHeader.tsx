'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { clearAccessToken } from '../../lib/auth/session';
import { logoutStoreOwner } from '../../lib/api/auth';
import NotificationBell from '../notifications/NotificationBell';

export default function DashboardHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutStoreOwner();
    } finally {
      clearAccessToken();
      Cookies.remove('access_token', { path: '/' });
      router.push('/store-owner/login');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-blue-600 bg-blue-700 px-6">
      <p className="text-sm font-medium text-blue-100">Dashboard Gian Hàng</p>
      <div className="flex items-center gap-3">
        <NotificationBell role="store-owner" />
        <button
          onClick={handleLogout}
          className="rounded-md border border-blue-500 px-3 py-1.5 text-sm text-blue-100 hover:bg-blue-800 hover:text-white"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
