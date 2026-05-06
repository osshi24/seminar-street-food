'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ImageOff,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Store,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react';
import { getAccessToken } from '../../../lib/auth/session';
import StatGrid, { type StatItem } from '../../../components/dashboard/StatGrid';
import StoreOwnerPageHeader from '../../../components/dashboard/common/StoreOwnerPageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { getMyStores, type StoreListItem } from '../../../lib/api/stores';
import { cn } from '../../../lib/cn';

const MAX_STORES = 3;

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: typeof Store;
  tone: 'orange' | 'emerald' | 'amber' | 'violet';
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/dashboard/stores',
    label: 'Quản lý gian hàng',
    description: 'Cập nhật mô tả, ảnh, menu món ăn.',
    icon: Store,
    tone: 'orange',
  },
  {
    href: '/dashboard/location',
    label: 'Vị trí trên bản đồ',
    description: 'Ghim toạ độ để khách dễ tìm đến.',
    icon: MapPin,
    tone: 'amber',
  },
  {
    href: '/dashboard/reviews',
    label: 'Bình luận khách hàng',
    description: 'Theo dõi đánh giá, báo cáo vi phạm.',
    icon: MessageSquare,
    tone: 'violet',
  },
];

const QUICK_TONE: Record<
  QuickAction['tone'],
  { iconBg: string; iconText: string; hover: string }
> = {
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-700',
    hover: 'hover:border-orange-200 hover:bg-orange-50/60',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/60',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    hover: 'hover:border-amber-200 hover:bg-amber-50/60',
  },
  violet: {
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-700',
    hover: 'hover:border-violet-200 hover:bg-violet-50/60',
  },
};

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const APPROVAL_BADGE = {
  pending: { label: 'Chờ duyệt', variant: 'warning' as const },
  approved: { label: 'Đã duyệt', variant: 'info' as const },
  rejected: { label: 'Bị từ chối', variant: 'danger' as const },
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const reload = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await getMyStores();
      const list = (Array.isArray(res) ? res : res.data) as StoreListItem[];
      setStores(Array.isArray(list) ? list : []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setStores([]);
      setLoadError((err as Error).message ?? 'Không thể tải dữ liệu dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/store-owner/login');
      return;
    }
    void reload();
  }, [router]);

  const summary = useMemo(() => {
    const total = stores.length;
    const approved = stores.filter((s) => s.approvalStatus === 'approved');
    const active = approved.filter((s) => s.status === 'active').length;
    const inactive = approved.filter((s) => s.status !== 'active').length;
    const pending = stores.filter((s) => s.approvalStatus === 'pending').length;
    const rejected = stores.filter((s) => s.approvalStatus === 'rejected').length;
    const slotsLeft = Math.max(0, MAX_STORES - total);

    const sortedByUpdate = [...stores].sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
    );
    const lastUpdate = sortedByUpdate[0]?.updatedAt ?? null;

    return { total, active, inactive, pending, rejected, slotsLeft, lastUpdate };
  }, [stores]);

  const stats: StatItem[] = [
    {
      label: 'Tổng gian hàng',
      value: isLoading ? '…' : `${summary.total}/${MAX_STORES}`,
      icon: Store,
      tone: 'orange',
      helperText: isLoading
        ? 'Đang tải...'
        : summary.slotsLeft > 0
          ? `Bạn có thể tạo thêm ${summary.slotsLeft} gian hàng nữa.`
          : 'Đã đạt giới hạn tối đa.',
    },
    {
      label: 'Đang hoạt động',
      value: isLoading ? '…' : summary.active,
      icon: CheckCircle2,
      tone: 'emerald',
      helperText: isLoading
        ? 'Đang tải...'
        : summary.inactive > 0
          ? `${summary.inactive} gian hàng đang tạm ẩn.`
          : 'Tất cả gian hàng đã duyệt đang mở.',
    },
    {
      label: 'Chờ duyệt',
      value: isLoading ? '…' : summary.pending,
      icon: Clock,
      tone: 'amber',
      helperText: isLoading
        ? 'Đang tải...'
        : summary.pending > 0
          ? 'Admin đang xem xét, hãy theo dõi thông báo.'
          : 'Không có gian hàng nào đang chờ.',
    },
    {
      label: 'Cập nhật gần nhất',
      value: isLoading
        ? '…'
        : summary.lastUpdate
          ? formatRelative(summary.lastUpdate)
          : '—',
      icon: RefreshCw,
      tone: 'purple',
      helperText: summary.rejected > 0
        ? `${summary.rejected} gian hàng đang bị từ chối, cần xem lại.`
        : 'Hãy duy trì cập nhật để gian hàng luôn hấp dẫn.',
    },
  ];

  const recentStores = useMemo(
    () =>
      [...stores]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 3),
    [stores],
  );

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Bảng điều khiển"
        title={
          <span>
            {getGreeting()}, chủ gian hàng! <span className="ml-1">🍜</span>
          </span>
        }
        description="Theo dõi nhanh tình trạng các gian hàng và truy cập các tác vụ thường dùng."
        meta={
          lastUpdatedAt ? (
            <span>Cập nhật lúc {lastUpdatedAt.toLocaleTimeString('vi-VN')}</span>
          ) : null
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              disabled={isLoading}
            >
              <RefreshCw className={cn(isLoading && 'animate-spin')} />
              Làm mới
            </Button>
            {summary.slotsLeft > 0 && (
              <Button asChild variant="primary" className="bg-orange-500 hover:bg-orange-600">
                <Link href="/dashboard/stores">
                  <Plus />
                  Thêm gian hàng
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-sm text-rose-700">{loadError}</CardContent>
        </Card>
      ) : null}

      <StatGrid stats={stats} />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Stores list */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
            <div>
              <CardTitle className="text-base">Gian hàng của tôi</CardTitle>
              <CardDescription>Truy cập nhanh và xem trạng thái từng gian hàng.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/stores">
                Xem tất cả
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : recentStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-50 text-orange-600">
                  <Store className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Chưa có gian hàng nào
                </p>
                <p className="mt-1 max-w-md text-xs text-slate-500">
                  Tạo gian hàng đầu tiên để bắt đầu hành trình kinh doanh.
                </p>
                <Button
                  asChild
                  variant="primary"
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                >
                  <Link href="/dashboard/stores">
                    <Plus />
                    Tạo gian hàng
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="-my-2 divide-y divide-slate-100">
                {recentStores.map((s) => (
                  <StoreRow key={s.id} store={s} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right column: Quick actions + Tips */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base">Truy cập nhanh</CardTitle>
              <CardDescription>Đi thẳng tới các tác vụ thường dùng.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {QUICK_ACTIONS.map((action) => {
                const t = QUICK_TONE[action.tone];
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors',
                      t.hover,
                    )}
                  >
                    <div
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                        t.iconBg,
                        t.iconText,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {action.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">{action.description}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-orange-900">
                <Sparkles className="h-4 w-4" />
                Mẹo tăng tương tác
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <TipRow text="Cập nhật ảnh đại diện rõ nét, hấp dẫn để khách click vào." />
              <TipRow text="Mô tả ngắn gọn nguyên liệu/khẩu vị giúp khách quyết định nhanh." />
              <TipRow text="Phản hồi bình luận đều đặn để tăng độ tin cậy." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StoreRow({ store }: { store: StoreListItem }) {
  const approval = APPROVAL_BADGE[store.approvalStatus];
  const isActive = store.status === 'active';

  return (
    <li>
      <Link
        href={`/dashboard/stores/${store.id}`}
        className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
          {store.thumbnailUrl ? (
            <img
              src={store.thumbnailUrl}
              alt={store.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="h-4 w-4 text-slate-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{store.name}</p>
            <Badge variant={approval.variant}>{approval.label}</Badge>
            {store.approvalStatus === 'approved' && (
              <Badge variant={isActive ? 'success' : 'muted'}>
                {isActive ? 'Hoạt động' : 'Tạm ẩn'}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {store.description || (
              <span className="italic text-slate-400">Chưa có thuyết minh</span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Cập nhật {formatRelative(store.updatedAt)}
          </p>
        </div>
        {store.approvalStatus === 'rejected' ? (
          <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
        ) : null}
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
      </Link>
    </li>
  );
}

function TipRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-white/70 p-2.5 ring-1 ring-orange-100">
      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
      <p className="text-xs leading-5 text-slate-700">{text}</p>
    </div>
  );
}
