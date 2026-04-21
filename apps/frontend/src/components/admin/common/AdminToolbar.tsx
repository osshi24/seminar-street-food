'use client';

import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../../lib/cn';

interface FilterChip {
  value: string;
  label: string;
  count?: number;
}

interface AdminToolbarProps {
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  rightSlot?: ReactNode;
}

export default function AdminToolbar({
  filters,
  activeFilter,
  onFilterChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  rightSlot,
}: AdminToolbarProps) {
  const hasFilters = filters && filters.length > 0;
  const hasSearch = onSearchChange !== undefined;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {hasFilters ? (
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const active = activeFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onFilterChange?.(f.value)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {f.label}
                  {typeof f.count === 'number' ? (
                    <span
                      className={cn(
                        'rounded px-1 text-[10px] font-semibold',
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {f.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {hasSearch ? (
            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchValue ?? ''}
                placeholder={searchPlaceholder}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-8 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </div>
  );
}
