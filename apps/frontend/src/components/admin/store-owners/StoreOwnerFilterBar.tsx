'use client';

import { useEffect, useState } from 'react';
import AdminToolbar from '../common/AdminToolbar';
import type { StoreOwnerStatus } from '../../../types/store-owner';

interface StoreOwnerFilterBarProps {
  currentStatus: StoreOwnerStatus | 'all';
  currentSearch: string;
  onStatusChange: (status: StoreOwnerStatus | 'all') => void;
  onSearchChange: (search: string) => void;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Vô hiệu hóa' },
  { value: 'rejected', label: 'Đã từ chối' },
];

export default function StoreOwnerFilterBar({
  currentStatus,
  currentSearch,
  onStatusChange,
  onSearchChange,
}: StoreOwnerFilterBarProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchInput === currentSearch) return;
    const timer = window.setTimeout(() => onSearchChange(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [currentSearch, onSearchChange, searchInput]);

  return (
    <AdminToolbar
      filters={STATUS_FILTERS}
      activeFilter={currentStatus}
      onFilterChange={(v) => onStatusChange(v as StoreOwnerStatus | 'all')}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Tìm theo tên, email hoặc gian hàng..."
    />
  );
}
