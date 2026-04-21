'use client';

import { Badge } from '../../ui/badge';
import type { BadgeProps } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';

interface LocationPinDetailHeaderProps {
  storeName: string;
  latitude: number | string;
  longitude: number | string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedAt: string;
  submittedBy?: string;
}

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  superseded: 'info',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPinDetailHeader({
  storeName,
  latitude,
  longitude,
  status,
  submittedAt,
  submittedBy,
}: LocationPinDetailHeaderProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">
              Chi tiết ghim vị trí
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {storeName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Tọa độ
                </p>
                <code className="mt-0.5 block font-mono text-sm font-medium text-slate-900">
                  {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                </code>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Ngày gửi
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">
                  {new Date(submittedAt).toLocaleString('vi-VN')}
                </p>
                {submittedBy ? (
                  <p className="mt-0.5 text-xs text-slate-500">bởi {submittedBy}</p>
                ) : null}
              </div>
            </div>
          </div>

          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
