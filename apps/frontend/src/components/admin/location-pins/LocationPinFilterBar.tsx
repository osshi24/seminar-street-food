'use client';

import { useEffect, useState } from 'react';
import AdminToolbar from '../common/AdminToolbar';

interface LocationPinFilterBarProps {
  currentStatus: string;
  currentSearch: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'superseded', label: 'Đã thay thế' },
];

export default function LocationPinFilterBar({
  currentStatus,
  currentSearch,
  onStatusChange,
  onSearchChange,
}: LocationPinFilterBarProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchInput === currentSearch) return;
    const timer = window.setTimeout(() => onSearchChange(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [currentSearch, onSearchChange, searchInput]);

  const activeFilter = currentStatus === '' ? 'all' : currentStatus;

  return (
    <AdminToolbar
      filters={STATUS_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={(v) => onStatusChange(v === 'all' ? '' : v)}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Tìm theo tên gian hàng, mã ghim hoặc tọa độ..."
    />
  );
}
