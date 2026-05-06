'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight, Inbox } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../../lib/api/notifications';
import type { Notification } from '../../types/notification';
import { cn } from '../../lib/cn';

interface NotificationBellProps {
  role: 'store-owner' | 'admin';
}

interface RoleAccent {
  inboxHref: string | null;
  badge: string;
  unreadDot: string;
  unreadRow: string;
  unreadBadgeChip: string;
  footerText: string;
  footerHover: string;
}

const ROLE_ACCENTS: Record<NotificationBellProps['role'], RoleAccent> = {
  'store-owner': {
    inboxHref: '/dashboard/notifications',
    badge: 'bg-orange-500',
    unreadDot: 'bg-orange-500',
    unreadRow: 'bg-orange-50/40',
    unreadBadgeChip: 'bg-orange-50 text-orange-700 ring-orange-200',
    footerText: 'text-orange-600',
    footerHover: 'hover:bg-orange-50',
  },
  admin: {
    inboxHref: null,
    badge: 'bg-slate-900',
    unreadDot: 'bg-slate-900',
    unreadRow: 'bg-slate-50',
    unreadBadgeChip: 'bg-slate-100 text-slate-700 ring-slate-200',
    footerText: 'text-slate-700',
    footerHover: 'hover:bg-slate-50',
  },
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const POLL_INTERVAL_MS = 60_000;

export default function NotificationBell({ role }: NotificationBellProps) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const accent = ROLE_ACCENTS[role];

  const load = useCallback(async () => {
    try {
      const result = await getNotifications(role, { limit: 8 });
      const list = result.data.data;
      setItems(list);
      setUnread(list.filter((n) => !n.isRead).length);
    } catch {
      // silent
    }
  }, [role]);

  useEffect(() => {
    void load();
    const handle = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleClick(n: Notification) {
    if (n.isRead) return;
    setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await markNotificationAsRead(role, n.id);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label="Thông báo"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white shadow-sm',
              accent.badge,
            )}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Thông báo</p>
            {unread > 0 && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                  accent.unreadBadgeChip,
                )}
              >
                {unread} chưa đọc
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                <Inbox className="h-4 w-4" />
              </div>
              <p className="mt-2 text-sm text-slate-500">Chưa có thông báo nào</p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50',
                    !n.isRead && accent.unreadRow,
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead ? (
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', accent.unreadDot)} />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm text-slate-900',
                          !n.isRead && 'font-semibold',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{n.body}</p>
                      )}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {accent.inboxHref && (
            <Link
              href={accent.inboxHref}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-xs font-semibold transition-colors',
                accent.footerText,
                accent.footerHover,
              )}
            >
              Xem tất cả thông báo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
