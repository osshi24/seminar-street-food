'use client';

import { useState } from 'react';

interface LocationPinFilterBarProps {
  currentStatus: string;
  currentSearch: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  '': 'Tất cả',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  superseded: 'Đã thay thế',
};

const STATUS_COLORS: Record<string, string> = {
  '': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
  superseded: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
};

export default function LocationPinFilterBar({
  currentStatus,
  currentSearch,
  onStatusChange,
  onSearchChange,
}: LocationPinFilterBarProps) {
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
            onClick={() => onStatusChange(status)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentStatus === status
                ? `${STATUS_COLORS[status]} ring-2 ring-offset-2 ring-${status === '' ? 'gray' : status}-300`
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Tìm kiếm theo tên gian hàng, ID, tọa độ..."
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
