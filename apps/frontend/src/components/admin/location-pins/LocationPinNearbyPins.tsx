'use client';

import Link from 'next/link';

interface NearbyPin {
  storeId: string;
  storeName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

interface LocationPinNearbyPinsProps {
  pins: NearbyPin[];
  currentPinId: string;
  isLoading?: boolean;
}

export default function LocationPinNearbyPins({
  pins,
  currentPinId,
  isLoading = false,
}: LocationPinNearbyPinsProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span>🔍</span> Pin gần đó
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <span>🔍</span> Pin gần đó
        </h3>
        <div className="py-6 text-center">
          <p className="text-sm text-gray-600">Không có pin nào gần đó</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span>🔍</span> Pin gần đó ({pins.length})
      </h3>

      <div className="space-y-3">
        {pins.map((pin, index) => (
          <Link
            key={`${pin.storeId}-${index}`}
            href={`/admin/stores/${pin.storeId}`}
            className="group block rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                  {pin.storeName}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span>📏 {(pin.distanceMeters / 1000).toFixed(2)} km</span>
                  <span>•</span>
                  <span>
                    {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                  </span>
                </div>
              </div>

              <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Xem gian hàng
              </span>
            </div>
          </Link>
        ))}
      </div>
      <span className="sr-only">{currentPinId}</span>
    </div>
  );
}
