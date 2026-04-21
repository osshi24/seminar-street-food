'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/cn';

export interface ReviewFilters {
  status?: 'visible' | 'hidden';
  keyword?: string;
}

interface ReviewFilterBarProps {
  filters: ReviewFilters;
  onApply: (filters: ReviewFilters) => void;
  onReset: () => void;
}

export default function ReviewFilterBar({ filters, onApply, onReset }: ReviewFilterBarProps) {
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
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
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
                className={cn(
                  'inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors',
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo nội dung bình luận..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              Xóa lọc
            </Button>
            <Button type="submit" size="sm">
              Áp dụng
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
