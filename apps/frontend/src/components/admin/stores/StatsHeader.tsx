'use client';

import { AdminStoreStatus } from '@/lib/api/admin-stores';

interface StatsHeaderProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export default function StatsHeader({ total, activeCount, inactiveCount }: StatsHeaderProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tổng gian hàng</div>
        <div className="mt-2 text-3xl font-bold text-gray-900">{total}</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-emerald-50 to-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          🟢 Đang hoạt động
        </div>
        <div className="mt-2 text-3xl font-bold text-emerald-700">{activeCount}</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          🔴 Vô hiệu hóa
        </div>
        <div className="mt-2 text-3xl font-bold text-slate-700">{inactiveCount}</div>
      </div>
    </div>
  );
}
