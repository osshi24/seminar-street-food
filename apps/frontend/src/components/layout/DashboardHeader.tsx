'use client';

import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { LogOut, Store, User, ExternalLink } from 'lucide-react';
import { clearAccessToken } from '../../lib/auth/session';
import { logoutStoreOwner } from '../../lib/api/auth';
import NotificationBell from '../notifications/NotificationBell';
import DashboardMobileNav from './DashboardMobileNav';
import { findActiveStoreOwnerNavItem } from './store-owner-nav-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface DashboardHeaderProps {
  storeName?: string;
}

export default function DashboardHeader({ storeName }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const active = findActiveStoreOwnerNavItem(pathname);
  const title = active?.label ?? 'Bảng điều khiển';
  const description = active?.description;

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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <DashboardMobileNav storeName={storeName} />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h1>
        {description ? (
          <p className="hidden truncate text-xs text-slate-500 sm:block">{description}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Xem trang công khai
        </a>

        <NotificationBell role="store-owner" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tài khoản"
              className="ml-1 flex h-9 items-center gap-2 rounded-md pl-1 pr-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-xs font-semibold text-white">
                <Store className="h-3.5 w-3.5" />
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                {storeName ?? 'Chủ gian hàng'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản chủ gian hàng</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User />
              Hồ sơ (sắp ra)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
            >
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
