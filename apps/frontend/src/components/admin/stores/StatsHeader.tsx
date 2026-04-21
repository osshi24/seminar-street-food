'use client';

import { Store, CheckCircle2, Ban } from 'lucide-react';
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
          icon: <Store />,
          description: 'Tổng số gian hàng đang quản lý.',
        },
        {
          label: 'Đang hoạt động',
          value: activeCount,
          tone: 'emerald',
          icon: <CheckCircle2 />,
          description: 'Gian hàng đang hiển thị và vận hành.',
        },
        {
          label: 'Vô hiệu hóa',
          value: inactiveCount,
          tone: 'slate',
          icon: <Ban />,
          description: 'Gian hàng tạm khóa hoặc chưa kích hoạt.',
        },
      ]}
    />
  );
}
