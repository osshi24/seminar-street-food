'use client';

import { AdminStoreStatus } from '@/lib/api/admin-stores';

interface StoreStatusBadgeProps {
  status: AdminStoreStatus;
  size?: 'sm' | 'md';
}

export default function StoreStatusBadge({ status, size = 'md' }: StoreStatusBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const statusClasses = {
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-slate-100 text-slate-700',
  };

  const statusLabels = {
    active: '🟢 Đang hoạt động',
    inactive: '🔴 Vô hiệu hóa',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
