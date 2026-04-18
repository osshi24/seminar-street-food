'use client';

import { useEffect, useState } from 'react';
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

const ACTIVE_STYLES: Record<string, string> = {
  all: 'border-slate-200 bg-slate-50 text-slate-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  inactive: 'border-slate-300 bg-slate-100 text-slate-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
};

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
    if (searchInput === currentSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      onSearchChange(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentSearch, onSearchChange, searchInput]);

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <button
                key={status}
                onClick={() => onStatusChange(status as StoreOwnerStatus | 'all')}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  currentStatus === status
                    ? ACTIVE_STYLES[status]
                    : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm leading-6 text-slate-500">
            Dùng bộ lọc để ưu tiên hồ sơ chờ duyệt hoặc rà soát nhanh các tài khoản đã bị khóa.
          </p>
        </div>

        <div className="relative w-full xl:max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Tìm theo tên, email hoặc gian hàng..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-11 pr-11 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
          />
          {searchInput ? (
            <button
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
