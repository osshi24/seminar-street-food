'use client';

import { MapPin, Hourglass, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import AdminMetricGrid from '../common/AdminMetricGrid';

interface LocationPinStatsCardProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  superseded: number;
}

export default function LocationPinStatsCard({
  total,
  pending,
  approved,
  rejected,
  superseded,
}: LocationPinStatsCardProps) {
  return (
    <AdminMetricGrid
      items={[
        { label: 'Tổng ghim', value: total, tone: 'blue', icon: <MapPin />, description: 'Đề xuất ghim đã gửi.' },
        { label: 'Chờ duyệt', value: pending, tone: 'amber', icon: <Hourglass />, description: 'Đang chờ admin đối chiếu.' },
        { label: 'Đã duyệt', value: approved, tone: 'emerald', icon: <CheckCircle2 />, description: 'Vị trí đang dùng chính thức.' },
        { label: 'Bị từ chối', value: rejected, tone: 'rose', icon: <XCircle />, description: 'Đề xuất không đủ điều kiện.' },
        { label: 'Đã thay thế', value: superseded, tone: 'violet', icon: <RefreshCw />, description: 'Bị thay thế bởi vị trí mới.' },
      ]}
    />
  );
}
