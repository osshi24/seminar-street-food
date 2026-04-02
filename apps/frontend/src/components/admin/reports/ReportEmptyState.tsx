'use client';

interface ReportEmptyStateProps {
  status: string;
  searchQuery?: string;
}

export default function ReportEmptyState({
  status,
  searchQuery,
}: ReportEmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Không tìm thấy kết quả</h3>
        <p className="mb-4 text-gray-600">
          Không có báo cáo nào khớp với tìm kiếm "<strong>{searchQuery}</strong>"
        </p>
      </div>
    );
  }

  const emptyStates: Record<string, { icon: string; title: string; description: string }> = {
    '': {
      icon: '📋',
      title: 'Chưa có báo cáo',
      description: 'Hệ thống chưa có báo cáo bình luận nào',
    },
    pending: {
      icon: '✅',
      title: 'Không có báo cáo chờ xử lý',
      description: 'Tất cả báo cáo đã được xử lý',
    },
    resolved: {
      icon: '✅',
      title: 'Không có báo cáo đã xử lý',
      description: 'Chưa có báo cáo nào được xử lý',
    },
    dismissed: {
      icon: '✕',
      title: 'Không có báo cáo bác bỏ',
      description: 'Chưa bác bỏ báo cáo nào',
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
