'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe, Shield, Store, User, Users } from 'lucide-react';
import {
  getActiveUsers,
  type ActiveUsersResponse,
  type ActiveUsersWindowKey,
} from '../../../lib/api/admin-monitoring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import Sparkline from './Sparkline';

const REFRESH_INTERVAL_MS = 30_000;

const WINDOW_LABELS: Record<ActiveUsersWindowKey, string> = {
  '5m': '5 phút',
  '15m': '15 phút',
  '1h': '1 giờ',
  '24h': '24 giờ',
};

function fillHours(
  series: ActiveUsersResponse['hourlySeries'],
): Array<{ hour: string; authed: number; anonIps: number }> {
  const map = new Map<string, { authed: number; anonIps: number }>();
  for (const p of series) {
    const key = new Date(p.hour).toISOString();
    map.set(key, { authed: p.authed, anonIps: p.anonIps });
  }
  const now = new Date();
  const startMs =
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime() -
    23 * 3600_000;
  const out: Array<{ hour: string; authed: number; anonIps: number }> = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(startMs + i * 3600_000).toISOString();
    out.push({ hour: t, authed: map.get(t)?.authed ?? 0, anonIps: map.get(t)?.anonIps ?? 0 });
  }
  return out;
}

export default function ActiveUsersPanel() {
  const [data, setData] = useState<ActiveUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWindow, setActiveWindow] = useState<ActiveUsersWindowKey>('5m');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getActiveUsers();
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const filled = useMemo(
    () => (data ? fillHours(data.hourlySeries) : []),
    [data],
  );

  const w = data?.windows[activeWindow];

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-white" />;
  }

  if (!data || !w) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Người dùng đang hoạt động</CardTitle>
          <CardDescription>
            Đếm distinct user / IP từ log request — không tính realtime presence socket.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-1 rounded-md bg-slate-100 p-1">
          {(Object.keys(WINDOW_LABELS) as ActiveUsersWindowKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setActiveWindow(k)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeWindow === k
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {WINDOW_LABELS[k]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Đã đăng nhập
              </span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {w.authedTotal}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              user duy nhất
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Admin
              </span>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {w.byRole.admin}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Chủ gian hàng
              </span>
              <Store className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {w.byRole.store_owner}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Khách hàng
              </span>
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {w.byRole.customer}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-cyan-50/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Khách vãng lai
              </span>
              <Globe className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {w.anonymousIps}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">distinct IP</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tổng <Badge variant="secondary">{w.requestCount}</Badge> request trong cửa sổ{' '}
            {WINDOW_LABELS[activeWindow]}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-medium text-slate-600">
            Hoạt động 24 giờ qua (theo giờ)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                User đã đăng nhập
              </p>
              <Sparkline
                values={filled.map((p) => p.authed)}
                color="#0f766e"
                fill="rgba(13, 148, 136, 0.1)"
                height={48}
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                Khách vãng lai (distinct IP)
              </p>
              <Sparkline
                values={filled.map((p) => p.anonIps)}
                color="#0369a1"
                fill="rgba(2, 132, 199, 0.1)"
                height={48}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
