'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import NotificationBell from '../notifications/NotificationBell';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('admin_access_token', { path: '/' });
    router.push('/admin/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-700 bg-slate-800 px-6">
      <p className="text-sm font-medium text-slate-300">Admin Panel</p>
      <div className="flex items-center gap-3">
        <NotificationBell role="admin" />
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
