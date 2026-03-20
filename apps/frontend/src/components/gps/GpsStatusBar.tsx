'use client';

import type { GPSStatus } from '../../lib/gps/proximitySession';

const STATUS_CONFIG: Record<GPSStatus, { icon: string; text: string; className: string }> = {
  idle: { icon: '📍', text: 'Chưa bật GPS', className: 'text-gray-500' },
  requesting: { icon: '🔄', text: 'Đang yêu cầu GPS...', className: 'text-blue-500' },
  granted: { icon: '✅', text: 'GPS đang hoạt động', className: 'text-green-600' },
  denied: { icon: '🚫', text: 'GPS bị từ chối', className: 'text-red-500' },
  unavailable: { icon: '⚠️', text: 'GPS không khả dụng', className: 'text-yellow-600' },
};

interface Props {
  gpsStatus: GPSStatus;
}

export default function GpsStatusBar({ gpsStatus }: Props) {
  const { icon, text, className } = STATUS_CONFIG[gpsStatus];
  return (
    <div className={`flex items-center gap-1.5 text-xs ${className}`}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
