'use client';

import Link from 'next/link';
import type { StoreOwner } from '../../../types/store-owner';

interface StoreOwnerTableRowProps {
  owner: StoreOwner;
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

export default function StoreOwnerTableRow({ owner, onQuickAction }: StoreOwnerTableRowProps) {
  return (
    <tr className="transition hover:bg-cyan-50/50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-100">
            {owner.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{owner.fullName}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
              {owner.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-slate-600">{owner.email}</td>
      <td className="px-5 py-4 text-sm text-slate-600">
        {owner.store?.name ? (
          <Link
            href={`/admin/stores/${owner.store.id}`}
            className="font-medium text-cyan-700 transition hover:text-cyan-800"
          >
            {owner.store.name}
          </Link>
        ) : (
          '—'
        )}
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[owner.status]}`}>
          {STATUS_LABELS[owner.status]}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-slate-600">
        {new Date(owner.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          {owner.status === 'pending' ? (
            <>
              <button
                onClick={() => onQuickAction?.('approve', owner.id)}
                className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Phê duyệt
              </button>
              <button
                onClick={() => onQuickAction?.('reject', owner.id)}
                className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Từ chối
              </button>
            </>
          ) : null}
          <Link
            href={`/admin/store-owners/${owner.id}`}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
          >
            Chi tiết
          </Link>
        </div>
      </td>
    </tr>
  );
}
