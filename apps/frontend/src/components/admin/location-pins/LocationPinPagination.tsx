'use client';

interface LocationPinPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function LocationPinPagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: LocationPinPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const getPageNumbers = () => {
    const pages: Array<number | string> = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (
      let page = Math.max(2, currentPage - 1);
      page <= Math.min(totalPages - 1, currentPage + 1);
      page += 1
    ) {
      if (!pages.includes(page)) {
        pages.push(page);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col gap-4 rounded-[32px] border border-slate-200 bg-white px-5 py-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-500">
        Hiển thị <span className="font-semibold text-slate-900">{startItem}</span> đến{' '}
        <span className="font-semibold text-slate-900">{endItem}</span> trong{' '}
        <span className="font-semibold text-slate-900">{total}</span> kết quả
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Trang trước
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={`${page}-${index}`}
              onClick={() => {
                if (typeof page === 'number') {
                  onPageChange(page);
                }
              }}
              disabled={page === '...' || page === currentPage}
              className={`min-w-10 rounded-full px-3 py-2 text-sm font-semibold transition ${
                page === currentPage
                  ? 'bg-slate-950 text-white'
                  : page === '...'
                    ? 'cursor-default text-slate-400'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
