'use client';

import Link from 'next/link';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import type { BadgeProps } from '../../ui/badge';
import type { StoreOwner } from '../../../types/store-owner';

interface StoreOwnerTableRowProps {
  owner: StoreOwner;
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  active: 'success',
  inactive: 'muted',
  rejected: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

export default function StoreOwnerTableRow({ owner, onQuickAction }: StoreOwnerTableRowProps) {
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
            {owner.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{owner.fullName}</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
              {owner.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{owner.email}</td>
      <td className="px-4 py-3 text-sm">
        {owner.store?.name ? (
          <Link
            href={`/admin/stores/${owner.store.id}`}
            className="font-medium text-cyan-700 transition-colors hover:text-cyan-800"
          >
            {owner.store.name}
          </Link>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[owner.status]}>{STATUS_LABELS[owner.status]}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {new Date(owner.createdAt).toLocaleDateString('vi-VN')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {owner.status === 'pending' ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onQuickAction?.('approve', owner.id)}
                className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Phê duyệt
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onQuickAction?.('reject', owner.id)}
                className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                Từ chối
              </Button>
            </>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/store-owners/${owner.id}`}>Chi tiết</Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}
