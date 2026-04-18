'use client';

import AdminMetricGrid from '../common/AdminMetricGrid';

interface StatsHeaderProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export default function StatsHeader({ total, activeCount, inactiveCount }: StatsHeaderProps) {
  return (
    <AdminMetricGrid
      items={[
        {
          label: 'Tổng gian hàng',
          value: total,
          tone: 'blue',
          icon: '🏪',
          description: 'Tổng số gian hàng đang được quản lý trong danh mục admin.',
        },
        {
          label: 'Đang hoạt động',
          value: activeCount,
          tone: 'emerald',
          icon: '✅',
          description: 'Các gian hàng hiện đang hiển thị và vận hành bình thường.',
        },
        {
          label: 'Vô hiệu hóa',
          value: inactiveCount,
          tone: 'slate',
          icon: '⛔',
          description: 'Các gian hàng đã bị tạm khóa hoặc chưa được kích hoạt.',
        },
      ]}
    />
  );
}
