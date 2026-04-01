'use client';

import Link from 'next/link';

interface NearbyPin {
  id: string;
  storeName: string;
  latitude: number;
  longitude: number;
  distance: number; // in meters
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
}

interface LocationPinNearbyPinsProps {
  pins: NearbyPin[];
  currentPinId: string;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  superseded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

export default function LocationPinNearbyPins({
  pins,
  currentPinId,
  isLoading = false,
}: LocationPinNearbyPinsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🔍</span> Pin gần đó
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🔍</span> Pin gần đó
        </h3>
        <div className="text-center py-6">
          <p className="text-sm text-gray-600">Không có pin nào gần đó</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>🔍</span> Pin gần đó ({pins.length})
      </h3>

      <div className="space-y-3">
        {pins.map((pin) => (
          <Link
            key={pin.id}
            href={`/admin/location-pins/${pin.id}`}
            className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {pin.storeName}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>📏 {(pin.distance / 1000).toFixed(2)} km</span>
                  <span>•</span>
                  <span>
                    {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                  </span>
                </div>
              </div>

              <span
                className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium border ${
                  STATUS_COLORS[pin.status]
                }`}
              >
                {STATUS_LABELS[pin.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
