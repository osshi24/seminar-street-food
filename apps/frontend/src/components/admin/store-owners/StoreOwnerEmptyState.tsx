'use client';

import { Search, Users } from 'lucide-react';
import AdminEmptyState from '../common/AdminEmptyState';
import type { StoreOwnerStatus } from '../../../types/store-owner';

interface StoreOwnerEmptyStateProps {
  status: StoreOwnerStatus | 'all';
  searchQuery?: string;
}

const STATES: Record<string, { title: string; description: string }> = {
  pending: {
    title: 'Không có hồ sơ chờ duyệt',
    description: 'Các yêu cầu đăng ký mới đã được xử lý hết.',
  },
  active: {
    title: 'Không có tài khoản đang hoạt động',
    description: 'Chưa có chủ gian hàng nào được kích hoạt trong bộ lọc hiện tại.',
  },
  inactive: {
    title: 'Không có tài khoản bị vô hiệu hóa',
    description: 'Chưa có tài khoản nào đang ở trạng thái tạm khóa.',
  },
  rejected: {
    title: 'Không có hồ sơ bị từ chối',
    description: 'Hiện không có hồ sơ nào nằm trong nhóm đã từ chối.',
  },
  all: {
    title: 'Chưa có chủ gian hàng',
    description: 'Hệ thống chưa có tài khoản chủ gian hàng nào để quản lý.',
  },
};

export default function StoreOwnerEmptyState({ status, searchQuery }: StoreOwnerEmptyStateProps) {
  if (searchQuery) {
    return (
      <AdminEmptyState
        icon={Search}
        title="Không tìm thấy kết quả"
        description={`Không có chủ gian hàng nào khớp với từ khóa "${searchQuery}".`}
      />
    );
  }

  const state = STATES[status] ?? STATES.all;
  return <AdminEmptyState icon={Users} title={state.title} description={state.description} />;
}
