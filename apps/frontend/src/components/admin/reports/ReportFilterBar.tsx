'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminToolbar from '../common/AdminToolbar';

interface ReportFilterBarProps {
  currentStatus: string;
  currentSearch: string;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'resolved', label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Bác bỏ' },
];

export default function ReportFilterBar({ currentStatus, currentSearch }: ReportFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchInput === currentSearch) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) params.set('search', searchInput.trim());
      else params.delete('search');
      params.set('page', '1');
      router.push(`/admin/reports?${params.toString()}`);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currentSearch, router, searchInput, searchParams]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = status === 'all' ? '' : status;
    if (value) params.set('status', value);
    else params.delete('status');
    params.set('page', '1');
    router.push(`/admin/reports?${params.toString()}`);
  };

  const activeFilter = currentStatus === '' ? 'all' : currentStatus;

  return (
    <AdminToolbar
      filters={STATUS_FILTERS}
      activeFilter={activeFilter}
      onFilterChange={handleStatusChange}
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Tìm theo gian hàng, khách hàng, lý do..."
    />
  );
}
