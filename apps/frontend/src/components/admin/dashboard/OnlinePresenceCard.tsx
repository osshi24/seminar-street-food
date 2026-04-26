'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Shield, Store, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { cn } from '../../../lib/cn';
import {
  getPresence,
  type PresenceSnapshot,
} from '../../../lib/api/admin-monitoring';

interface Tile {
  label: string;
  icon: LucideIcon;
  color: string;
  getValue: (s: PresenceSnapshot) => number;
}

// "Khách" gộp khách đã đăng nhập (byRole.customer, qua WebSocket) và public chưa
// đăng nhập (publicVisitors, qua heartbeat 30s).
const TILES: Tile[] = [
  {
    label: 'Admin',
    icon: Shield,
    color: 'text-cyan-700 bg-cyan-50',
    getValue: (s) => s.byRole.admin,
  },
  {
    label: 'Chủ gian hàng',
    icon: Store,
    color: 'text-amber-700 bg-amber-50',
    getValue: (s) => s.byRole.store_owner,
  },
  {
    label: 'Khách',
    icon: Users,
    color: 'text-violet-700 bg-violet-50',
    getValue: (s) => s.byRole.customer + s.publicVisitors,
  },
];

function computeTotal(s: PresenceSnapshot | null): number {
  if (!s) return 0;
  return s.byRole.admin + s.byRole.store_owner + s.byRole.customer + s.publicVisitors;
}

export default function OnlinePresenceCard() {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    getPresence()
      .then(setSnapshot)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io('/admin/monitoring', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:updated', (snap: PresenceSnapshot) => setSnapshot(snap));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const total = computeTotal(snapshot);

  return (
    <Card>
      <CardContent className="p-3.5 pt-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  connected ? 'animate-ping bg-emerald-400' : 'bg-slate-300',
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-3 w-3 rounded-full',
                  connected ? 'bg-emerald-500' : 'bg-slate-400',
                )}
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Đang online ngay</h3>
                <Badge variant={connected ? 'success' : 'muted'}>
                  {connected ? 'Realtime' : 'Đang chờ'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Tổng <span className="font-semibold text-slate-900">{total}</span> người đang
                online · cập nhật khi có thay đổi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:gap-3">
            {TILES.map(({ label, icon: Icon, color, getValue }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2 lg:min-w-[130px]"
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-md',
                    color,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="text-base font-semibold leading-tight text-slate-900">
                    {snapshot ? getValue(snapshot) : 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
