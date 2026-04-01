'use client';

interface LocationPinDetailHeaderProps {
  storeName: string;
  latitude: number | string;
  longitude: number | string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedAt: string;
  submittedBy?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; emoji: string; icon: string }
> = {
  pending: {
    label: 'Chờ duyệt',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    emoji: '⏳',
    icon: '✓',
  },
  approved: {
    label: 'Đã duyệt',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    emoji: '✅',
    icon: '✓',
  },
  rejected: {
    label: 'Bị từ chối',
    badge: 'bg-red-100 text-red-800 border-red-300',
    emoji: '❌',
    icon: '✕',
  },
  superseded: {
    label: 'Đã thay thế',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    emoji: '🔄',
    icon: '→',
  },
};

export default function LocationPinDetailHeader({
  storeName,
  latitude,
  longitude,
  status,
  submittedAt,
  submittedBy,
}: LocationPinDetailHeaderProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">📍</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
              <p className="text-sm text-gray-600">Ghim vị trí</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="font-medium">Tọa độ:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
              </code>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>Gửi:</span>
              <span>{new Date(submittedAt).toLocaleString('vi-VN')}</span>
              {submittedBy && <span className="text-gray-500">bởi {submittedBy}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className={`rounded-lg border px-4 py-3 text-center ${statusConfig.badge}`}>
            <div className="text-2xl mb-1">{statusConfig.emoji}</div>
            <div className="text-xs font-semibold">{statusConfig.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
