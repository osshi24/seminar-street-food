'use client';

import { useState } from 'react';
import type { StoreOwnerStatus } from '../../../types/store-owner';

interface StoreOwnerFilterBarProps {
  currentStatus: StoreOwnerStatus | 'all';
  currentSearch: string;
  onStatusChange: (status: StoreOwnerStatus | 'all') => void;
  onSearchChange: (search: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

const STATUS_COLORS: Record<string, string> = {
  all: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  active: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  inactive: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
};

export default function StoreOwnerFilterBar({
  currentStatus,
  currentSearch,
  onStatusChange,
  onSearchChange,
}: StoreOwnerFilterBarProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const timer = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <button
            key={status}
            onClick={() => onStatusChange(status as StoreOwnerStatus | 'all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentStatus === status
                ? `${STATUS_COLORS[status]} ring-2 ring-offset-2 ring-${status === 'all' ? 'gray' : status}-300`
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search and clear button */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên, email, tên gian hàng..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
