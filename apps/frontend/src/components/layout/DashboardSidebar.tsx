'use client';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useState } from 'react';
import { ChefHat, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '../../lib/cn';
import DashboardSidebarNav from './DashboardSidebarNav';

const COOKIE_KEY = 'store_owner_sidebar_collapsed';

interface DashboardSidebarProps {
  storeName?: string;
  initialCollapsed?: boolean;
}

export default function DashboardSidebar({
  storeName,
  initialCollapsed = false,
}: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    Cookies.set(COOKIE_KEY, next ? '1' : '0', { path: '/', expires: 365 });
  };

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white lg:flex',
        collapsed ? 'w-[68px]' : 'w-[248px]',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-200',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-4',
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2.5 text-slate-900',
            collapsed && 'justify-center',
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm">
            <ChefHat className="h-[18px] w-[18px]" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">Phố Ẩm Thực</p>
              <p className="truncate text-[11px] leading-tight text-slate-500">
                {storeName ?? 'Chủ gian hàng'}
              </p>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <DashboardSidebarNav collapsed={collapsed} />
      </div>

      {!collapsed && (
        <div className="mx-3 mb-2 rounded-lg border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
            Mẹo nhỏ
          </p>
          <p className="mt-1 text-xs leading-4 text-slate-600">
            Cập nhật menu &amp; hình ảnh để thu hút khách hàng nhiều hơn.
          </p>
        </div>
      )}

      <div className="border-t border-slate-200 p-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900',
            collapsed && 'justify-center',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
