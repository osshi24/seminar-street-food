'use client';

import type { GPSStatus } from '../../lib/gps/proximitySession';

interface Props {
  gpsStatus: GPSStatus;
}

export default function GpsPermissionBanner({ gpsStatus }: Props) {
  if (gpsStatus !== 'denied' && gpsStatus !== 'unavailable') return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <p className="font-medium">
        {gpsStatus === 'denied'
          ? 'GPS bị từ chối — Vui lòng bật GPS để nghe thuyết minh tự động.'
          : 'GPS không khả dụng — Kiểm tra kết nối GPS của thiết bị.'}
      </p>
      {gpsStatus === 'denied' && (
        <p className="mt-1 text-xs text-yellow-700">
          Vào cài đặt trình duyệt → Quyền truy cập → Vị trí → Cho phép.
        </p>
      )}
    </div>
  );
}
