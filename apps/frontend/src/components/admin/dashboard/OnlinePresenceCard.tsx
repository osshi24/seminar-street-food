'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Card, CardContent } from '../../ui/card';
import { cn } from '../../../lib/cn';
import {
  getPresence,
  type PresenceSnapshot,
} from '../../../lib/api/admin-monitoring';

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
    <Card className="w-fit">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
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
          <div>
            <p className="text-xs font-medium text-slate-600">Người online</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{snapshot ? total : 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
