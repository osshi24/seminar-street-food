'use client';

import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import AdminMobileNav from './AdminMobileNav';
import { findActiveNavItem } from './admin-nav-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const active = findActiveNavItem(pathname);
  const title = active?.label ?? 'Admin';

  const handleLogout = () => {
    Cookies.remove('admin_access_token', { path: '/' });
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <AdminMobileNav />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell role="admin" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tài khoản"
              className="ml-1 flex h-9 items-center gap-2 rounded-md pl-1 pr-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                A
              </span>
              <span className="hidden text-sm font-medium sm:inline">Admin</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User />
              Hồ sơ (sắp ra)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
