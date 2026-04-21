'use client';

import { ArrowLeft } from 'lucide-react';
import { Badge } from '../../ui/badge';
import type { BadgeProps } from '../../ui/badge';
import type { StoreOwner } from '../../../types/store-owner';

interface StoreOwnerDetailHeaderProps {
  owner: StoreOwner;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  active: 'success',
  inactive: 'muted',
  rejected: 'danger',
};

export default function StoreOwnerDetailHeader({ owner, onBack }: StoreOwnerDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </button>

      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-slate-100 text-xl font-semibold text-slate-700">
            {owner.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {owner.fullName}
              </h1>
              <Badge variant={STATUS_VARIANT[owner.status]}>{STATUS_LABELS[owner.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{owner.email}</p>
            {owner.phone ? <p className="text-sm text-slate-500">{owner.phone}</p> : null}
          </div>
        </div>
        <div className="text-xs text-slate-500 sm:text-right">
          Đăng ký: {new Date(owner.createdAt).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </div>
  );
}
