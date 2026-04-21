'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Globe, Shield, Store, User, Users } from 'lucide-react';
import {
  getPresence,
  type PresenceSnapshot,
} from '../../../lib/api/admin-monitoring';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';

export default function ActiveUsersPanel() {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    getPresence()
      .then((data) => {
        setSnapshot(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu người online');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const socket = io('/admin/monitoring', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence:updated', (snap: PresenceSnapshot) => {
      setSnapshot(snap);
      setError(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-white" />;
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-4 text-sm text-rose-700">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-4 text-sm text-slate-600">
          Không có dữ liệu người dùng đang online.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Người dùng đang online</CardTitle>
          <CardDescription>
            Real-time presence từ WebSocket connection
            {connected && <span className="ml-2 text-emerald-600">● Kết nối</span>}
            {!connected && <span className="ml-2 text-slate-500">● Chờ kết nối</span>}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tổng cộng
              </span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {snapshot.byRole.admin +
                snapshot.byRole.store_owner +
                snapshot.byRole.customer +
                snapshot.publicVisitors}
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
              {snapshot.byRole.admin}
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
              {snapshot.byRole.store_owner}
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
              {snapshot.byRole.customer}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Khách công khai
              </span>
              <Globe className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">
              {snapshot.publicVisitors}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
