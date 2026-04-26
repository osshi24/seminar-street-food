'use client';

import { Users, Hourglass, CheckCircle2, Ban, XCircle } from 'lucide-react';
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
        { label: 'Tổng tài khoản', value: total, tone: 'blue', icon: <Users />, description: 'Tài khoản chủ gian hàng đã đăng ký.' },
        { label: 'Chờ duyệt', value: pending, tone: 'amber', icon: <Hourglass />, description: 'Hồ sơ mới đang chờ admin phê duyệt.' },
        { label: 'Đang hoạt động', value: active, tone: 'emerald', icon: <CheckCircle2 />, description: 'Có thể đăng nhập và vận hành.' },
        { label: 'Vô hiệu hóa', value: inactive, tone: 'slate', icon: <Ban />, description: 'Đã bị tạm khóa bởi admin.' },
        { label: 'Đã từ chối', value: rejected, tone: 'rose', icon: <XCircle />, description: 'Hồ sơ không đạt yêu cầu.' },
      ]}
    />
  );
}
