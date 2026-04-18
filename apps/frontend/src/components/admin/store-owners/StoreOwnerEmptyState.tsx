'use client';

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
      <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-500">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-900">Không tìm thấy kết quả</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Không có chủ gian hàng nào khớp với từ khóa <span className="font-semibold text-slate-700">"{searchQuery}"</span>.
        </p>
      </div>
    );
  }

  const emptyStates: Record<string, { title: string; description: string }> = {
    pending: {
      title: 'Không có hồ sơ chờ duyệt',
      description: 'Các yêu cầu đăng ký mới hiện đã được xử lý hết.',
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

  const state = emptyStates[status] ?? emptyStates.all;

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-50 text-cyan-700">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M17 20h5V4H2v16h5m10 0v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m8-12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-slate-900">{state.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{state.description}</p>
    </div>
  );
}
