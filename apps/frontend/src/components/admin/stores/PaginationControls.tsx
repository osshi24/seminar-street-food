'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 sm:flex-row">
      <div className="text-sm text-gray-600">
        Hiển thị <span className="font-semibold text-gray-900">{startItem}</span> đến{' '}
        <span className="font-semibold text-gray-900">{endItem}</span> của{' '}
        <span className="font-semibold text-gray-900">{total}</span> kết quả
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Trước
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum: number;

            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-10 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                  pageNum === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
}
