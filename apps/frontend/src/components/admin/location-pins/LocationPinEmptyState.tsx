'use client';

interface LocationPinEmptyStateProps {
  status: string;
  searchQuery?: string;
}

export default function LocationPinEmptyState({
  status,
  searchQuery,
}: LocationPinEmptyStateProps) {
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
          Không có ghim vị trí nào khớp với từ khóa <span className="font-semibold text-slate-700">"{searchQuery}"</span>.
        </p>
      </div>
    );
  }

  const emptyStates: Record<string, { title: string; description: string }> = {
    '': {
      title: 'Chưa có ghim vị trí',
      description: 'Hệ thống chưa ghi nhận đề xuất ghim nào để xử lý.',
    },
    pending: {
      title: 'Không có ghim chờ duyệt',
      description: 'Tất cả các ghim mới hiện đã được admin xử lý.',
    },
    approved: {
      title: 'Không có ghim đã duyệt',
      description: 'Chưa có ghim nào nằm trong nhóm đã phê duyệt ở bộ lọc hiện tại.',
    },
    rejected: {
      title: 'Không có ghim bị từ chối',
      description: 'Chưa có đề xuất nào bị từ chối trong nhóm đang xem.',
    },
    superseded: {
      title: 'Không có ghim đã thay thế',
      description: 'Chưa có ghim nào được đánh dấu đã bị thay thế.',
    },
  };

  const state = emptyStates[status] ?? emptyStates[''];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-50 text-cyan-700">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 21s-6-5.33-6-10a6 6 0 1112 0c0 4.67-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z"
          />
        </svg>
      </div>
      <h3 className="mt-5 text-xl font-semibold text-slate-900">{state.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{state.description}</p>
    </div>
  );
}
