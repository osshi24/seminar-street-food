'use client';

import AdminMetricGrid from '../common/AdminMetricGrid';

interface StoreOwnerStatsCardProps {
  total: number;
  pending: number;
  active: number;
  inactive: number;
  rejected: number;
}

export default function StoreOwnerStatsCard({
  total,
  pending,
  active,
  inactive,
  rejected,
}: StoreOwnerStatsCardProps) {
  return (
    <AdminMetricGrid
      items={[
        {
          label: 'Tổng chủ gian hàng',
          value: total,
          tone: 'blue',
          icon: '👥',
          description: 'Tổng số tài khoản store owner đã đăng ký trong hệ thống.',
        },
        {
          label: 'Chờ duyệt',
          value: pending,
          tone: 'amber',
          icon: '⏳',
          description: 'Những tài khoản mới đang chờ admin phê duyệt hồ sơ đăng ký.',
        },
        {
          label: 'Đang hoạt động',
          value: active,
          tone: 'emerald',
          icon: '✅',
          description: 'Các chủ gian hàng hiện có thể đăng nhập và vận hành gian hàng.',
        },
        {
          label: 'Vô hiệu hóa',
          value: inactive,
          tone: 'slate',
          icon: '⛔',
          description: 'Tài khoản đã bị tạm khóa hoặc vô hiệu hóa bởi admin.',
        },
        {
          label: 'Đã từ chối',
          value: rejected,
          tone: 'rose',
          icon: '❌',
          description: 'Các hồ sơ đăng ký không đạt yêu cầu và đã bị từ chối.',
        },
      ]}
    />
  );
}
