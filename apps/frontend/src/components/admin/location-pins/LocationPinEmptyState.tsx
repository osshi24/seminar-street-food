'use client';

import { MapPin, Search } from 'lucide-react';
import AdminEmptyState from '../common/AdminEmptyState';

interface LocationPinEmptyStateProps {
  status: string;
  searchQuery?: string;
}

const STATES: Record<string, { title: string; description: string }> = {
  '': {
    title: 'Chưa có ghim vị trí',
    description: 'Hệ thống chưa ghi nhận đề xuất ghim nào để xử lý.',
  },
  pending: {
    title: 'Không có ghim chờ duyệt',
    description: 'Tất cả ghim mới đã được admin xử lý.',
  },
  approved: {
    title: 'Không có ghim đã duyệt',
    description: 'Chưa có ghim nào trong nhóm đã phê duyệt.',
  },
  rejected: {
    title: 'Không có ghim bị từ chối',
    description: 'Chưa có đề xuất nào bị từ chối.',
  },
  superseded: {
    title: 'Không có ghim đã thay thế',
    description: 'Chưa có ghim nào bị thay thế.',
  },
};

export default function LocationPinEmptyState({ status, searchQuery }: LocationPinEmptyStateProps) {
  if (searchQuery) {
    return (
      <AdminEmptyState
        icon={Search}
        title="Không tìm thấy kết quả"
        description={`Không có ghim nào khớp với từ khóa "${searchQuery}".`}
      />
    );
  }
  const state = STATES[status] ?? STATES[''];
  return <AdminEmptyState icon={MapPin} title={state.title} description={state.description} />;
}
