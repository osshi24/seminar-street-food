'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  getMonitoringOverview,
  getPresence,
  type MetricsSnapshot,
  type OverviewResponse,
  type PresenceSnapshot,
  type SeriesPoint,
} from '../../../lib/api/admin-monitoring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import MetricStatCard from './MetricStatCard';
import ActiveUsersPanel from './ActiveUsersPanel';
import PresencePanel from './PresencePanel';

const MAX_SERIES = 120;
const RANGE_MINUTES = 60;

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function MonitoringOverviewPanel() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [latest, setLatest] = useState<MetricsSnapshot | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [presence, setPresence] = useState<PresenceSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchInitial = async () => {
    try {
      const [res, pres] = await Promise.all([
        getMonitoringOverview(RANGE_MINUTES),
        getPresence().catch(() => null),
      ]);
      setData(res);
      setLatest(res.latest);
      setSeries(res.series);
      setPresence(pres);
      setError(null);
    } catch {
      setError('Không tải được dữ liệu giám sát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInitial();
  }, []);

  useEffect(() => {
    const beUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
    const socket = io(`${beUrl}/admin/monitoring`, {
      path: '/socket.io',
      transports: ['polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('presence:updated', (snap: PresenceSnapshot) => {
      setPresence(snap);
    });

    socket.on('metrics:snapshot', (snap: MetricsSnapshot) => {
      setLatest(snap);
      setSeries((prev) => {
        const next: SeriesPoint = {
          ts: snap.ts,
          requestsTotal: snap.requestsTotal,
          errorsTotal: snap.errorsTotal,
          avgLatencyMs: snap.avgLatencyMs,
          p95LatencyMs: snap.p95LatencyMs,
          memRssMb: snap.memRss / 1024 / 1024,
          eventLoopLagMs: snap.eventLoopLagMs,
        };
        const merged = [...prev, next];
        return merged.length > MAX_SERIES
          ? merged.slice(merged.length - MAX_SERIES)
          : merged;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const trends = useMemo(() => {
    return {
      requests: series.map((s) => s.requestsTotal),
      errors: series.map((s) => s.errorsTotal),
      latency: series.map((s) => s.p95LatencyMs ?? 0),
      memory: series.map((s) => s.memRssMb),
      lag: series.map((s) => s.eventLoopLagMs),
    };
  }, [series]);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-white" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm text-rose-700">
          {error ?? 'Không có dữ liệu.'}
        </CardContent>
      </Card>
    );
  }

  const errorRate =
    latest && latest.requestsTotal > 0
      ? (latest.errorsTotal / latest.requestsTotal) * 100
      : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={connected ? 'success' : 'muted'}>
          {connected ? 'Realtime · đã kết nối' : 'Offline · đang dùng dữ liệu cache'}
        </Badge>
        {latest ? (
          <span className="text-xs text-slate-500">
            Cập nhật lúc {formatTime(latest.ts)}
          </span>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void fetchInitial()}
          className="ml-auto"
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Tải lại
        </Button>
      </div>

      <PresencePanel snapshot={presence} connected={connected} />

      <ActiveUsersPanel />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricStatCard
          label="Request / cửa sổ 30s"
          value={latest ? String(latest.requestsTotal) : '0'}
          hint={`Tỉ lệ lỗi 5xx: ${errorRate.toFixed(2)}%`}
          trend={trends.requests}
          trendColor="#0f766e"
          trendFill="rgba(13, 148, 136, 0.1)"
          icon={<Activity className="h-4 w-4" />}
          tone={errorRate >= 10 ? 'danger' : 'default'}
        />
        <MetricStatCard
          label="Latency p95"
          value={
            latest?.p95LatencyMs != null
              ? `${latest.p95LatencyMs.toFixed(0)} ms`
              : '—'
          }
          hint={
            latest?.avgLatencyMs != null
              ? `Trung bình ${latest.avgLatencyMs.toFixed(0)} ms`
              : 'Chưa có request'
          }
          trend={trends.latency}
          trendColor="#0369a1"
          trendFill="rgba(2, 132, 199, 0.1)"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricStatCard
          label="Lỗi 5xx"
          value={latest ? String(latest.errorsTotal) : '0'}
          hint="Số lỗi trong cửa sổ 30s gần nhất"
          trend={trends.errors}
          trendColor="#b91c1c"
          trendFill="rgba(220, 38, 38, 0.08)"
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={latest && latest.errorsTotal > 0 ? 'warning' : 'default'}
        />
        <MetricStatCard
          label="Bộ nhớ RSS"
          value={latest ? formatBytes(latest.memRss) : '—'}
          hint={
            latest
              ? `Heap: ${formatBytes(latest.memHeapUsed)} / ${formatBytes(latest.memHeapTotal)}`
              : ''
          }
          trend={trends.memory}
          trendColor="#7c3aed"
          trendFill="rgba(124, 58, 237, 0.08)"
          icon={<HardDrive className="h-4 w-4" />}
        />
        <MetricStatCard
          label="Event loop lag"
          value={
            latest ? `${latest.eventLoopLagMs.toFixed(1)} ms` : '—'
          }
          hint={
            latest?.loadAvg1 != null
              ? `Load avg 1m: ${latest.loadAvg1.toFixed(2)}`
              : ''
          }
          trend={trends.lag}
          trendColor="#ea580c"
          trendFill="rgba(234, 88, 12, 0.08)"
          icon={<Cpu className="h-4 w-4" />}
          tone={latest && latest.eventLoopLagMs >= 100 ? 'warning' : 'default'}
        />
        <MetricStatCard
          label="Uptime"
          value={latest ? formatUptime(latest.uptimeSec) : '—'}
          hint={
            latest?.pgPool
              ? `PG pool: ${latest.pgPool.idle}/${latest.pgPool.total} idle · ${latest.pgPool.waiting} waiting`
              : 'Pool stats không khả dụng'
          }
          icon={<Server className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>BullMQ Queues</CardTitle>
            <CardDescription>Job đang chờ / chạy / lỗi theo queue</CardDescription>
          </CardHeader>
          <CardContent>
            {latest && latest.queues.length > 0 ? (
              <div className="space-y-3">
                {latest.queues.map((q) => (
                  <div
                    key={q.name}
                    className="rounded-md border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">{q.name}</p>
                      {q.failed > 0 ? (
                        <Badge variant="danger">{q.failed} failed</Badge>
                      ) : (
                        <Badge variant="success">healthy</Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-slate-600">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Waiting
                        </p>
                        <p className="font-semibold text-slate-900">{q.waiting}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Active
                        </p>
                        <p className="font-semibold text-slate-900">{q.active}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Delayed
                        </p>
                        <p className="font-semibold text-slate-900">{q.delayed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Done
                        </p>
                        <p className="font-semibold text-slate-900">
                          {q.completed}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có dữ liệu queue.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top route theo lưu lượng</CardTitle>
            <CardDescription>Trong {RANGE_MINUTES} phút gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topRoutes.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có request nào.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.topRoutes.map((r) => (
                  <li
                    key={`${r.method}-${r.route}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          {r.method}
                        </span>
                        {r.route}
                      </p>
                      <p className="text-xs text-slate-500">
                        Trung bình {r.avgDurationMs.toFixed(0)} ms
                        {r.errorCount > 0 ? ` · ${r.errorCount} lỗi` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary">{r.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lỗi gần nhất</CardTitle>
          <CardDescription>20 lỗi 4xx/5xx mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentErrors.length === 0 ? (
            <p className="text-sm text-slate-500">Không có lỗi nào trong khoảng thời gian này.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-2 py-2 font-medium">Thời gian</th>
                    <th className="px-2 py-2 font-medium">Method</th>
                    <th className="px-2 py-2 font-medium">Route</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Duration</th>
                    <th className="px-2 py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentErrors.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-2 py-2 text-xs text-slate-500">
                        {formatTime(e.ts)}
                      </td>
                      <td className="px-2 py-2 text-xs font-medium text-slate-700">
                        {e.method}
                      </td>
                      <td className="px-2 py-2 max-w-[280px] truncate text-slate-900">
                        {e.route}
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant={e.statusCode >= 500 ? 'danger' : 'warning'}>
                          {e.statusCode}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-xs text-slate-500">
                        {e.durationMs} ms
                      </td>
                      <td className="px-2 py-2 max-w-[280px] truncate text-xs text-slate-600">
                        {e.errorCode ? `[${e.errorCode}] ` : ''}
                        {e.errorMessage ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
