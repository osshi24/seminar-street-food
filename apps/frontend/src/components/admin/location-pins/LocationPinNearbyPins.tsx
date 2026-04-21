'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

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
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 border-b border-slate-100">
        <Search className="h-4 w-4 text-slate-500" />
        <CardTitle className="text-sm">
          Pin gần đó {pins.length > 0 ? `(${pins.length})` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-slate-50" />
            ))}
          </div>
        ) : pins.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Không có pin nào gần đó</p>
        ) : (
          <div className="space-y-2">
            {pins.map((pin, index) => (
              <Link
                key={`${pin.storeId}-${index}`}
                href={`/admin/stores/${pin.storeId}`}
                className="group block rounded-md border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-cyan-700">
                      {pin.storeName}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>{(pin.distanceMeters / 1000).toFixed(2)} km</span>
                      <span>·</span>
                      <span className="font-mono">
                        {Number(pin.latitude).toFixed(5)}, {Number(pin.longitude).toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="info">Xem</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
        <span className="sr-only">{currentPinId}</span>
      </CardContent>
    </Card>
  );
}
