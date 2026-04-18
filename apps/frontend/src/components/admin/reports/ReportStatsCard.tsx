'use client';

import AdminMetricGrid from '../common/AdminMetricGrid';

interface ReportStatsCardProps {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export default function ReportStatsCard({
  total,
  pending,
  resolved,
  dismissed,
}: ReportStatsCardProps) {
  return (
    <AdminMetricGrid
      items={[
        {
          label: 'Tổng cộng',
          value: total,
          tone: 'slate',
          icon: '📋',
          description: 'Tổng số báo cáo bình luận đã đi qua hệ thống kiểm duyệt.',
        },
        {
          label: 'Chờ xử lý',
          value: pending,
          tone: 'amber',
          icon: '⏳',
          description: 'Các báo cáo đang chờ admin ra quyết định ẩn, xóa hoặc bác bỏ.',
        },
        {
          label: 'Đã xử lý',
          value: resolved,
          tone: 'emerald',
          icon: '✅',
          description: 'Đã được xử lý bằng hành động ẩn hoặc xóa bình luận.',
        },
        {
          label: 'Bác bỏ',
          value: dismissed,
          tone: 'violet',
          icon: '✕',
          description: 'Các báo cáo được kết luận không vi phạm hoặc không cần can thiệp.',
        },
      ]}
    />
  );
}
