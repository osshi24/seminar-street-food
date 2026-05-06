'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Inbox,
  RefreshCw,
  XCircle,
  PauseCircle,
  PlayCircle,
  UserPlus,
} from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../../../../lib/api/notifications';
import type { Notification, NotificationEventType } from '../../../../types/notification';
import StoreOwnerPageHeader from '../../../../components/dashboard/common/StoreOwnerPageHeader';
import StoreOwnerEmptyState from '../../../../components/dashboard/common/StoreOwnerEmptyState';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { cn } from '../../../../lib/cn';

type Filter = 'all' | 'unread';

const EVENT_META: Record<
  NotificationEventType,
  { icon: typeof Bell; tone: string; label: string }
> = {
  REGISTRATION_SUBMITTED: {
    icon: UserPlus,
    tone: 'bg-blue-50 text-blue-600',
    label: 'Đăng ký',
  },
  ACCOUNT_APPROVED: {
    icon: CheckCircle2,
    tone: 'bg-emerald-50 text-emerald-600',
    label: 'Phê duyệt',
  },
  ACCOUNT_REJECTED: {
    icon: XCircle,
    tone: 'bg-rose-50 text-rose-600',
    label: 'Từ chối',
  },
  ACCOUNT_DEACTIVATED: {
    icon: PauseCircle,
    tone: 'bg-amber-50 text-amber-600',
    label: 'Tạm khoá',
  },
  ACCOUNT_REACTIVATED: {
    icon: PlayCircle,
    tone: 'bg-emerald-50 text-emerald-600',
    label: 'Mở lại',
  },
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function StoreOwnerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const result = await getNotifications('store-owner', { limit: 100 });
      setItems(result.data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.isRead) : items),
    [items, filter],
  );

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );

  async function handleMarkRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationAsRead('store-owner', id);
    } catch {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
    }
  }

  async function handleMarkAllRead() {
    const unread = items.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await Promise.all(unread.map((n) => markNotificationAsRead('store-owner', n.id)));
    } catch {
      await load();
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Hộp thư"
        title="Thông báo"
        description="Phê duyệt, cập nhật trạng thái tài khoản và các tin từ Admin gửi đến bạn."
        meta={
          unreadCount > 0
            ? `${unreadCount} thông báo chưa đọc`
            : 'Bạn đã đọc tất cả thông báo'
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn(refreshing && 'animate-spin')} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
            >
              <CheckCheck />
              {markingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <FilterPill
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="Tất cả"
            count={items.length}
          />
          <FilterPill
            active={filter === 'unread'}
            onClick={() => setFilter('unread')}
            label="Chưa đọc"
            count={unreadCount}
            highlight
          />
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <StoreOwnerEmptyState
          icon={Inbox}
          title={filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Hộp thư trống'}
          description={
            filter === 'unread'
              ? 'Bạn đã đọc hết tất cả thông báo. Các thông báo mới sẽ xuất hiện ở đây.'
              : 'Khi Admin gửi thông tin liên quan đến tài khoản hoặc gian hàng, thông báo sẽ hiển thị tại đây.'
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  highlight?: boolean;
}

function FilterPill({ active, onClick, label, count, highlight }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600',
      )}
    >
      {label}
      <span
        className={cn(
          'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
          active
            ? 'bg-white/20 text-white'
            : highlight && count > 0
              ? 'bg-orange-100 text-orange-600'
              : 'bg-slate-100 text-slate-600',
        )}
      >
        {count}
      </span>
    </button>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const meta = EVENT_META[notification.eventType] ?? {
    icon: Bell,
    tone: 'bg-slate-100 text-slate-600',
    label: 'Thông báo',
  };
  const Icon = meta.icon;
  const unread = !notification.isRead;

  return (
    <Card
      className={cn(
        'transition-colors hover:border-orange-300',
        unread && 'border-orange-200 bg-orange-50/40',
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-full',
            meta.tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
            <Badge variant="muted" className="text-[10px]">
              {meta.label}
            </Badge>
            {unread && (
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500" aria-label="Chưa đọc" />
            )}
          </div>
          {notification.body && (
            <p className="mt-1 text-sm leading-5 text-slate-600">{notification.body}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">
            {formatRelative(notification.createdAt)}
          </p>
        </div>
        {unread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(notification.id)}
            className="shrink-0 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
          >
            <CheckCircle2 />
            Đã đọc
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
