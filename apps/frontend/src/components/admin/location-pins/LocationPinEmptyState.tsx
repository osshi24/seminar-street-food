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
      <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Không tìm thấy kết quả</h3>
        <p className="mb-4 text-gray-600">
          Không có ghim vị trí nào khớp với tìm kiếm "<strong>{searchQuery}</strong>"
        </p>
      </div>
    );
  }

  const emptyStates: Record<string, { icon: string; title: string; description: string }> = {
    '': {
      icon: '📍',
      title: 'Chưa có ghim vị trí',
      description: 'Hệ thống chưa có ghim vị trí nào',
    },
    pending: {
      icon: '⏳',
      title: 'Không có ghim chờ duyệt',
      description: 'Tất cả yêu cầu ghim vị trí đã được xử lý',
    },
    approved: {
      icon: '✅',
      title: 'Không có ghim được duyệt',
      description: 'Chưa có ghim vị trí nào được phê duyệt',
    },
    rejected: {
      icon: '❌',
      title: 'Không có ghim bị từ chối',
      description: 'Chưa từ chối ghim vị trí nào',
    },
    superseded: {
      icon: '🔄',
      title: 'Không có ghim bị thay thế',
      description: 'Chưa thay thế ghim vị trí nào',
    },
  };

  const state = emptyStates[status] || emptyStates[''];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
      <div className="mb-4 text-5xl">{state.icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{state.title}</h3>
      <p className="text-gray-600">{state.description}</p>
    </div>
  );
}
