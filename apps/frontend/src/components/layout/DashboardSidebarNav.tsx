'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/cn';
import { STORE_OWNER_NAV_GROUPS, type StoreOwnerNavItem } from './store-owner-nav-config';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { getNotifications } from '../../lib/api/notifications';

interface Props {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

const NOTIFICATIONS_HREF = '/dashboard/notifications';
const POLL_INTERVAL_MS = 60_000;

function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getNotifications('store-owner', { isRead: false, limit: 100 });
        if (!cancelled) setCount(result.data.total ?? result.data.data.length);
      } catch {
        if (!cancelled) setCount(0);
      }
    }
    void load();
    const handle = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  return count;
}

export default function DashboardSidebarNav({ collapsed = false, onNavigate }: Props) {
  const pathname = usePathname();
  const unreadCount = useUnreadNotificationCount();

  const getBadge = (item: StoreOwnerNavItem): number | null => {
    if (item.href === NOTIFICATIONS_HREF && unreadCount > 0) return unreadCount;
    return null;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <nav className={cn('flex flex-col gap-5', collapsed ? 'px-2' : 'px-3')}>
        {STORE_OWNER_NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {!collapsed && (
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              const badge = getBadge(item);

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-md text-sm font-medium transition-colors',
                    collapsed ? 'h-10 w-10 justify-center' : 'h-9 px-2.5',
                    active
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-700',
                  )}
                >
                  <span className="relative">
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-colors',
                        active
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-orange-700',
                      )}
                    />
                    {collapsed && badge !== null && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge !== null && (
                        <span
                          className={cn(
                            'ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-orange-100 text-orange-700',
                          )}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              if (!collapsed) return link;

              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                    {badge !== null ? ` (${badge})` : ''}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );
}
