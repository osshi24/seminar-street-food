'use client';

import Link from 'next/link';

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

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  superseded: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPinTable({ pins, onQuickAction }: LocationPinTableProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Gian hàng
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Tọa độ
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Trạng thái
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Ngày gửi
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Tác vụ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pins.map((pin) => (
              <tr key={pin.id} className="transition hover:bg-cyan-50/50">
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {pin.store?.name || pin.storeId.slice(0, 8)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {pin.id.slice(0, 8)}
                      </p>
                    </div>
                    {pin.hasDuplicateWarning ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Có cảnh báo trùng tọa độ
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-slate-600">
                  {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[pin.status]}`}>
                    {STATUS_LABELS[pin.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Date(pin.submittedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {pin.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => onQuickAction?.('approve', pin.id)}
                          className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => onQuickAction?.('reject', pin.id)}
                          className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Từ chối
                        </button>
                      </>
                    ) : null}
                    <Link
                      href={`/admin/location-pins/${pin.id}`}
                      className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
                    >
                      Chi tiết
                    </Link>
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
