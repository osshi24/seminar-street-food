'use client';

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
        {
          label: 'Tổng ghim',
          value: total,
          tone: 'blue',
          icon: '📍',
          description: 'Tổng số đề xuất ghim vị trí đã được gửi lên hệ thống.',
        },
        {
          label: 'Chờ duyệt',
          value: pending,
          tone: 'amber',
          icon: '⏳',
          description: 'Các ghim mới đang chờ admin đối chiếu và quyết định.',
        },
        {
          label: 'Đã duyệt',
          value: approved,
          tone: 'emerald',
          icon: '✅',
          description: 'Các vị trí đang được sử dụng chính thức trên bản đồ.',
        },
        {
          label: 'Bị từ chối',
          value: rejected,
          tone: 'rose',
          icon: '❌',
          description: 'Đề xuất ghim không hợp lệ hoặc không đủ điều kiện phê duyệt.',
        },
        {
          label: 'Đã thay thế',
          value: superseded,
          tone: 'violet',
          icon: '🔄',
          description: 'Các ghim cũ đã được thay thế bởi một vị trí được duyệt mới hơn.',
        },
      ]}
    />
  );
}
