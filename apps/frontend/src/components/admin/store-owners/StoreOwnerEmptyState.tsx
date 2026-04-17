'use client';

import Link from 'next/link';
import type { StoreOwnerStatus } from '../../../types/store-owner';

interface StoreOwnerEmptyStateProps {
  status: StoreOwnerStatus | 'all';
  searchQuery?: string;
}

export default function StoreOwnerEmptyState({
  status,
  searchQuery,
}: StoreOwnerEmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Không tìm thấy kết quả</h3>
        <p className="mb-4 text-gray-600">
          Không có chủ gian hàng nào khớp với tìm kiếm "<strong>{searchQuery}</strong>"
        </p>
      </div>
    );
  }

  const emptyStates: Record<
    string,
    { icon: string; title: string; description: string }
  > = {
    pending: {
      icon: '⏳',
      title: 'Không có yêu cầu chờ duyệt',
      description: 'Tất cả yêu cầu từ chủ gian hàng đã được xử lý',
    },
    active: {
      icon: '✅',
      title: 'Không có chủ gian hàng đang hoạt động',
      description: 'Chưa có chủ gian hàng nào được phê duyệt',
    },
    inactive: {
      icon: '⛔',
      title: 'Không có chủ gian hàng bị vô hiệu hóa',
      description: 'Tất cả chủ gian hàng đều đang hoạt động',
    },
    rejected: {
      icon: '❌',
      title: 'Không có yêu cầu bị từ chối',
      description: 'Tất cả yêu cầu đã được phê duyệt',
    },
    all: {
      icon: '👥',
      title: 'Chưa có chủ gian hàng',
      description: 'Hệ thống chưa có chủ gian hàng nào',
    },
  };

  const state = emptyStates[status as string] || emptyStates['all'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
      <div className="mb-4 text-5xl">{state.icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{state.title}</h3>
      <p className="text-gray-600">{state.description}</p>
    </div>
  );
}
