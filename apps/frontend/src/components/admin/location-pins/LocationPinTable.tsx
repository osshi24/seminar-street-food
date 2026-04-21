'use client';

import Link from 'next/link';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import type { BadgeProps } from '../../ui/badge';

interface LocationPin {
  id: string;
  storeId: string;
  store?: { name: string; id: string };
  latitude: number | string;
  longitude: number | string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedAt: string;
  hasDuplicateWarning?: boolean;
}

interface LocationPinTableProps {
  pins: LocationPin[];
  onQuickAction?: (action: 'approve' | 'reject' | 'delete', id: string) => void;
}

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  superseded: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPinTable({ pins, onQuickAction }: LocationPinTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              {['Gian hàng', 'Tọa độ', 'Trạng thái', 'Ngày gửi', 'Tác vụ'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                    i === 4 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pins.map((pin) => (
              <tr key={pin.id} className="transition-colors hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="space-y-1.5">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {pin.store?.name || pin.storeId.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                        {pin.id.slice(0, 8)}
                      </p>
                    </div>
                    {pin.hasDuplicateWarning ? (
                      <Badge variant="warning">Trùng tọa độ</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[pin.status]}>{STATUS_LABELS[pin.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(pin.submittedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {pin.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onQuickAction?.('approve', pin.id)}
                          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onQuickAction?.('reject', pin.id)}
                          className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        >
                          Từ chối
                        </Button>
                      </>
                    ) : null}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/location-pins/${pin.id}`}>Chi tiết</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
