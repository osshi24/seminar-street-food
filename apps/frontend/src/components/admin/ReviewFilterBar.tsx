'use client';

import { useEffect, useState } from 'react';

export interface ReviewFilters {
  status?: 'visible' | 'hidden';
  keyword?: string;
}

interface ReviewFilterBarProps {
  filters: ReviewFilters;
  onApply: (filters: ReviewFilters) => void;
  onReset: () => void;
}

export default function ReviewFilterBar({
  filters,
  onApply,
  onReset,
}: ReviewFilterBarProps) {
  const [keyword, setKeyword] = useState(filters.keyword ?? '');
  const [status, setStatus] = useState<'visible' | 'hidden' | ''>(filters.status ?? '');

  useEffect(() => {
    setKeyword(filters.keyword ?? '');
    setStatus(filters.status ?? '');
  }, [filters.keyword, filters.status]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onApply({
      keyword: keyword.trim() || undefined,
      status: status || undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Bộ lọc bình luận
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Tập trung vào những bình luận cần xử lý
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Xóa lọc
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Áp dụng
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            🔎
          </span>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo nội dung bình luận..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {[
            { key: '', label: 'Tất cả' },
            { key: 'visible', label: 'Đang hiển thị' },
            { key: 'hidden', label: 'Đang ẩn' },
          ].map((item) => {
            const active = status === item.key;

            return (
              <button
                key={item.key || 'all'}
                type="button"
                onClick={() => setStatus(item.key as 'visible' | 'hidden' | '')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
