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

const STATUS_COLORS: Record<string, { badge: string; border: string }> = {
  pending: {
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-l-4 border-l-amber-500',
  },
  approved: {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-l-4 border-l-emerald-500',
  },
  rejected: {
    badge: 'bg-red-100 text-red-800',
    border: 'border-l-4 border-l-red-500',
  },
  superseded: {
    badge: 'bg-purple-100 text-purple-800',
    border: 'border-l-4 border-l-purple-500',
  },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPinTable({
  pins,
  onQuickAction,
}: LocationPinTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Gian hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Tọa độ
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ngày gửi
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pins.map((pin) => {
            const statusColor = STATUS_COLORS[pin.status];
            return (
              <tr key={pin.id} className={`${statusColor.border} hover:bg-gray-50 transition-colors`}>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {pin.store?.name || pin.storeId.slice(0, 8)}
                    </div>
                    {pin.hasDuplicateWarning && (
                      <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        ⚠️ Trùng tọa độ
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor.badge}`}>
                    {STATUS_LABELS[pin.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(pin.submittedAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {pin.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onQuickAction?.('approve', pin.id)}
                          className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                        >
                          ✓ Duyệt
                        </button>
                        <button
                          onClick={() => onQuickAction?.('reject', pin.id)}
                          className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 font-medium"
                        >
                          ✕ Từ chối
                        </button>
                      </>
                    )}
                    <Link
                      href={`/admin/location-pins/${pin.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
