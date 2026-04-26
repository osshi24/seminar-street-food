'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileEdit,
  Flag,
  MapPin,
  MessageSquare,
  Star,
  Store,
  Tags,
  Users,
} from 'lucide-react';
import AdminPageHeader from '../../../components/admin/common/AdminPageHeader';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { cn } from '../../../lib/cn';
import { getAdminOverview, type AdminOverviewResponse } from '../../../lib/api/admin-overview';

function formatRelative(dateString: string) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMin = Math.round((now - then) / 60000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} ngày trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

interface ActivityItem {
  id: string;
  type: 'draft' | 'report' | 'review';
  timestamp: string;
  title: string;
  meta: string;
  body?: string;
  href?: string;
  badge?: { label: string; variant: 'warning' | 'danger' | 'success' | 'default' };
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch(() => setError('Không thể tải dữ liệu tổng quan admin.'))
      .finally(() => setLoading(false));
  }, []);

  const queues = useMemo(() => {
    if (!overview) return [];
    return [
      {
        href: '/admin/store-owners?status=pending',
        label: 'Hồ sơ chủ gian hàng',
        value: overview.metrics.storeOwners.pending,
        icon: Users,
        tone: 'amber' as const,
      },
      {
        href: '/admin/store-drafts',
        label: 'Bản nháp gian hàng',
        value: overview.metrics.drafts.pending,
        icon: FileEdit,
        tone: 'rose' as const,
      },
      {
        href: '/admin/location-pins?status=pending',
        label: 'Ghim vị trí',
        value: overview.metrics.locationPins.pending,
        icon: MapPin,
        tone: 'emerald' as const,
      },
      {
        href: '/admin/reports?status=pending',
        label: 'Báo cáo bình luận',
        value: overview.metrics.reports.pending,
        icon: Flag,
        tone: 'cyan' as const,
      },
    ];
  }, [overview]);

  const totalPending = useMemo(
    () => queues.reduce((sum, q) => sum + q.value, 0),
    [queues],
  );

  const stats = useMemo(() => {
    if (!overview) return [];
    const m = overview.metrics;
    return [
      {
        label: 'Gian hàng',
        value: m.stores.total,
        sub: `${m.stores.active} hoạt động · ${m.stores.inactive} tạm ẩn`,
        icon: Store,
        href: '/admin/stores',
      },
      {
        label: 'Chủ gian hàng',
        value: m.storeOwners.total,
        sub: `${m.storeOwners.active} hoạt động · ${m.storeOwners.rejected} từ chối`,
        icon: Users,
        href: '/admin/store-owners',
      },
      {
        label: 'Bình luận',
        value: m.reviews.total,
        sub: `${m.reviews.visible} hiển thị · ${m.reviews.hidden} đang ẩn`,
        icon: MessageSquare,
        href: '/admin/reviews',
      },
      {
        label: 'Nhãn sở thích',
        value: m.tags.total,
        sub: 'Phân loại món, khẩu vị, dị ứng',
        icon: Tags,
        href: '/admin/tags',
      },
    ];
  }, [overview]);

  const health = useMemo(() => {
    if (!overview) return [];
    const m = overview.metrics;
    return [
      {
        label: 'Gian hàng đang hoạt động',
        current: m.stores.active,
        total: m.stores.total,
      },
      {
        label: 'Bình luận hiển thị',
        current: m.reviews.visible,
        total: m.reviews.total,
      },
      {
        label: 'Hồ sơ chủ đã duyệt',
        current: m.storeOwners.active,
        total: m.storeOwners.total,
      },
      {
        label: 'Báo cáo đã xử lý',
        current: m.reports.resolved,
        total: m.reports.total,
      },
    ];
  }, [overview]);

  const activities = useMemo<ActivityItem[]>(() => {
    if (!overview) return [];
    const items: ActivityItem[] = [];

    overview.recentDrafts.forEach((d) =>
      items.push({
        id: `draft-${d.id}`,
        type: 'draft',
        timestamp: d.submittedAt,
        title: d.proposedName || d.store?.name || 'Bản nháp chưa đặt tên',
        meta: d.store?.name ? `Gian hàng: ${d.store.name}` : 'Chưa có gian hàng gốc',
        href: `/admin/store-drafts/${d.id}`,
        badge: { label: 'Bản nháp', variant: 'warning' },
      }),
    );

    overview.recentReports.forEach((r) =>
      items.push({
        id: `report-${r.id}`,
        type: 'report',
        timestamp: r.createdAt,
        title: r.review?.storeName ?? 'Bình luận chưa gắn gian hàng',
        meta: `Báo cáo bởi ${r.reporter?.fullName ?? 'ẩn danh'} · ${r.reason?.labelVi ?? 'Mới'}`,
        body: r.review?.content ?? undefined,
        href: '/admin/reports',
        badge: { label: 'Báo cáo', variant: 'danger' },
      }),
    );

    overview.recentReviews.forEach((r) =>
      items.push({
        id: `review-${r.id}`,
        type: 'review',
        timestamp: r.createdAt,
        title: r.customer?.displayName ?? 'Khách vãng lai',
        meta: `${r.store?.name ?? 'Không rõ gian hàng'} · ${r.stars}/5 sao${r.reportCount ? ` · ${r.reportCount} báo cáo` : ''}`,
        body: r.content ?? undefined,
        href: r.store?.id ? `/admin/stores/${r.store.id}` : '/admin/reviews',
        badge: r.isHidden
          ? { label: 'Đang ẩn', variant: 'default' }
          : { label: 'Bình luận', variant: 'success' },
      }),
    );

    return items
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 12);
  }, [overview]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="h-80 animate-pulse rounded-xl bg-white" />
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm text-rose-700">
          {error ?? 'Không có dữ liệu tổng quan.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        badge="Bảng điều khiển"
        title="Tổng quan hệ thống"
        description="Theo dõi nhanh các hàng chờ kiểm duyệt và hoạt động chính của admin."
        action={
          totalPending > 0 ? (
            <Button asChild>
              <Link href="/admin/reports?status=pending">
                {totalPending} mục cần xử lý
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Mọi việc đã xử lý
            </span>
          )
        }
      />

      {/* Hàng chờ kiểm duyệt — to và rõ ràng nhất */}
      <section>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hàng chờ kiểm duyệt</h2>
            <p className="text-xs text-slate-500">Click để mở danh sách đang chờ.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queues.map((q) => (
            <QueueCard key={q.href} {...q} />
          ))}
        </div>
      </section>

      {/* Thống kê tổng */}
      <section>
        <div className="mb-2.5">
          <h2 className="text-sm font-semibold text-slate-900">Thống kê hệ thống</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </section>

      {/* Sức khỏe + Hoạt động */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Sức khỏe hệ thống</CardTitle>
            <CardDescription>Tỉ lệ hoạt động / hoàn tất theo từng nhóm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {health.map((h) => (
              <HealthBar key={h.label} {...h} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
              <CardDescription className="mt-0.5">
                Bản nháp, báo cáo và bình luận mới nhất.
              </CardDescription>
            </div>
            <Badge variant="muted">{activities.length}</Badge>
          </CardHeader>
          <CardContent className="pt-5">
            {activities.length === 0 ? (
              <div className="rounded-md bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                Chưa có hoạt động nào trong khoảng gần đây.
              </div>
            ) : (
              <ul className="-my-2 divide-y divide-slate-100">
                {activities.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const QUEUE_TONE: Record<
  string,
  { ring: string; iconBg: string; iconText: string; valueColor: string }
> = {
  amber: {
    ring: 'ring-amber-200/70',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    valueColor: 'text-amber-700',
  },
  rose: {
    ring: 'ring-rose-200/70',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-700',
    valueColor: 'text-rose-700',
  },
  emerald: {
    ring: 'ring-emerald-200/70',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    valueColor: 'text-emerald-700',
  },
  cyan: {
    ring: 'ring-cyan-200/70',
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-700',
    valueColor: 'text-cyan-700',
  },
};

interface QueueCardProps {
  href: string;
  label: string;
  value: number;
  icon: typeof Users;
  tone: keyof typeof QUEUE_TONE;
}

function QueueCard({ href, label, value, icon: Icon, tone }: QueueCardProps) {
  const t = QUEUE_TONE[tone];
  const empty = value === 0;
  return (
    <Link
      href={href}
      className={cn(
        'group rounded-xl border bg-white p-4 ring-1 transition-shadow hover:shadow-md',
        empty ? 'border-slate-200 ring-slate-200/70' : 'border-slate-200',
        !empty && t.ring,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p
            className={cn(
              'mt-2 text-3xl font-semibold tracking-tight',
              empty ? 'text-slate-400' : t.valueColor,
            )}
          >
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {empty ? 'Không có mục nào đang chờ.' : 'đang chờ xử lý'}
          </p>
        </div>
        <div
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
            empty ? 'bg-slate-100 text-slate-400' : `${t.iconBg} ${t.iconText}`,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-900">
        Xem danh sách
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  icon: typeof Users;
  href: string;
}

function StatCard({ label, value, sub, icon: Icon, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-700" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p>
    </Link>
  );
}

function HealthBar({ label, current, total }: { label: string; current: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : pct === 0 ? 'bg-slate-300' : 'bg-rose-500';
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-medium text-slate-900">
          {current}
          <span className="text-slate-400">/{total}</span>
          <span className="ml-2 text-xs text-slate-500">{pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.type === 'draft' ? FileEdit : item.type === 'report' ? Flag : Star;

  const inner = (
    <div className="flex gap-3 py-3">
      <div
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md',
          item.type === 'draft' && 'bg-amber-100 text-amber-700',
          item.type === 'report' && 'bg-rose-100 text-rose-700',
          item.type === 'review' && 'bg-violet-100 text-violet-700',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
          {item.badge ? <Badge variant={item.badge.variant}>{item.badge.label}</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">{item.meta}</p>
        {item.body ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.body}</p>
        ) : null}
        <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
          {formatRelative(item.timestamp)}
        </p>
      </div>
    </div>
  );

  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          className="block -mx-2 rounded-md px-2 transition-colors hover:bg-slate-50"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return <li>{inner}</li>;
}
