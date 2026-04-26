'use client';

import { Globe, Store } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import type { PresenceSnapshot } from '../../../lib/api/admin-monitoring';

interface PresencePanelProps {
  snapshot: PresenceSnapshot | null;
  connected: boolean;
}

export default function PresencePanel({ snapshot, connected }: PresencePanelProps) {
  const ownerCount = snapshot?.byRole.store_owner ?? 0;
  const publicCount = snapshot?.publicVisitors ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${connected ? 'animate-ping bg-emerald-400' : 'bg-slate-300'} opacity-75`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`}
              />
            </span>
            Đang online ngay
          </CardTitle>
          <CardDescription>
            Chủ gian hàng (Socket.IO) và khách public (heartbeat 30s, dedup theo
            thiết bị).
          </CardDescription>
        </div>
        <Badge variant={connected ? 'success' : 'muted'}>
          {connected ? 'Realtime' : 'Đang chờ kết nối'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Chủ gian hàng
              </span>
              <Store className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {ownerCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Đang mở dashboard store-owner
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Khách public
              </span>
              <Globe className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {publicCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thiết bị duy nhất đang xem trang public
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          1 thiết bị mở nhiều tab vẫn đếm 1 (dedup theo <code>visitor_id</code> trong
          localStorage). Tab ẩn tạm dừng heartbeat để tiết kiệm pin.
        </p>
      </CardContent>
    </Card>
  );
}
