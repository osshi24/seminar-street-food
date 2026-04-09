'use client';

import { useState } from 'react';

export interface ReviewFilters {
  storeId?: string;
  status?: 'visible' | 'hidden' | '';
  keyword?: string;
}

interface ReviewFilterBarProps {
  onFilter: (filters: ReviewFilters) => void;
}

export default function ReviewFilterBar({ onFilter }: ReviewFilterBarProps) {
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState<'visible' | 'hidden' | ''>('');
  const [keyword, setKeyword] = useState('');

  const handleApply = () => {
    onFilter({
      storeId: storeId || undefined,
      status: status || undefined,
      keyword: keyword || undefined,
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Từ khóa</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm nội dung..."
          className="rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-orange-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Trạng thái</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-orange-400 focus:outline-none"
        >
          <option value="">Tất cả</option>
          <option value="visible">Hiển thị</option>
          <option value="hidden">Đã ẩn</option>
        </select>
      </div>
      <button
        type="button"
        onClick={handleApply}
        className="rounded bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
      >
        Áp dụng
      </button>
    </div>
  );
}
