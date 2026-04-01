'use client';

import Link from 'next/link';
import type { StoreOwner } from '../../../types/store-owner';

interface StoreOwnerTableRowProps {
  owner: StoreOwner;
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

const STATUS_COLORS: Record<string, { badge: string; border: string }> = {
  pending: {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-l-4 border-l-amber-500',
  },
  active: {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-l-4 border-l-emerald-500',
  },
  inactive: {
    badge: 'bg-slate-100 text-slate-800',
    border: 'border-l-4 border-l-slate-500',
  },
  rejected: {
    badge: 'bg-red-100 text-red-800',
    border: 'border-l-4 border-l-red-500',
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

export default function StoreOwnerTableRow({
  owner,
  onQuickAction,
}: StoreOwnerTableRowProps) {
  const statusColor = STATUS_COLORS[owner.status];

  return (
    <tr className={`${statusColor.border} hover:bg-gray-50 transition-colors`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
            {owner.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{owner.fullName}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{owner.email}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {owner.store?.name ? (
          <Link href={`/admin/stores/${owner.store.id}`} className="text-blue-600 hover:underline">
            {owner.store.name}
          </Link>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor.badge}`}>
          {STATUS_LABELS[owner.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(owner.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {owner.status === 'pending' && (
            <>
              <button
                onClick={() => onQuickAction?.('approve', owner.id)}
                className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
              >
                ✓ Duyệt
              </button>
              <button
                onClick={() => onQuickAction?.('reject', owner.id)}
                className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium"
              >
                ✕ Từ chối
              </button>
            </>
          )}
          <Link
            href={`/admin/store-owners/${owner.id}`}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Chi tiết
          </Link>
        </div>
      </td>
    </tr>
  );
}
