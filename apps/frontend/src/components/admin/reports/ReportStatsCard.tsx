'use client';

import { ClipboardList, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
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
        { label: 'Tổng cộng', value: total, tone: 'slate', icon: <ClipboardList />, description: 'Báo cáo đã đi qua hệ thống.' },
        { label: 'Chờ xử lý', value: pending, tone: 'amber', icon: <Hourglass />, description: 'Đang chờ admin ra quyết định.' },
        { label: 'Đã xử lý', value: resolved, tone: 'emerald', icon: <CheckCircle2 />, description: 'Đã ẩn hoặc xóa bình luận.' },
        { label: 'Bác bỏ', value: dismissed, tone: 'violet', icon: <XCircle />, description: 'Không vi phạm hoặc không cần can thiệp.' },
      ]}
    />
  );
}
