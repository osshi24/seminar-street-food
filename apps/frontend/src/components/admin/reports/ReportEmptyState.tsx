'use client';

import { ClipboardList, Search } from 'lucide-react';
import AdminEmptyState from '../common/AdminEmptyState';

interface ReportEmptyStateProps {
  status: string;
  searchQuery?: string;
}

const STATES: Record<string, { title: string; description: string }> = {
  '': { title: 'Chưa có báo cáo', description: 'Hệ thống chưa có báo cáo bình luận nào.' },
  pending: { title: 'Không có báo cáo chờ xử lý', description: 'Tất cả báo cáo đã được xử lý.' },
  resolved: { title: 'Không có báo cáo đã xử lý', description: 'Chưa có báo cáo nào được xử lý.' },
  dismissed: { title: 'Không có báo cáo bác bỏ', description: 'Chưa bác bỏ báo cáo nào.' },
};

export default function ReportEmptyState({ status, searchQuery }: ReportEmptyStateProps) {
  if (searchQuery) {
    return (
      <AdminEmptyState
        icon={Search}
        title="Không tìm thấy kết quả"
        description={`Không có báo cáo nào khớp với "${searchQuery}".`}
      />
    );
  }
  const state = STATES[status] || STATES[''];
  return <AdminEmptyState icon={ClipboardList} title={state.title} description={state.description} />;
}
